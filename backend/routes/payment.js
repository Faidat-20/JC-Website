const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");
const { sendOrderConfirmationEmail, sendOwnerNotificationEmail } = require("../utils/mailer");

// ─────────────────────────────────────────
// INITIATE PAYMENT
// ─────────────────────────────────────────
router.post("/", async (req, res) => {
  const { userId, cart, deliveryDetails, shipping, total, shippingOption, subtotal } = req.body;

  try {
    const newOrder = new Order({
      userId,
      items: cart,
      deliveryDetails,
      shippingOption,
      subtotal,
      shippingFee: shipping,
      total,
      paymentStatus: "pending"
    });
    const savedOrder = await newOrder.save();

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: deliveryDetails.email,
        amount: total * 100,
        callback_url: `${process.env.FRONTEND_URL}/order-success.html?orderId=${savedOrder._id}`,
        metadata: { orderId: String(savedOrder._id) }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    res.json({
      success: true,
      paymentLink: response.data.data.authorization_url
    });

  } catch (err) {
    console.error("Payment initiation error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
});

// ─────────────────────────────────────────
// PAYSTACK WEBHOOK
// ─────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {

  // 1. Verify the request actually came from Paystack
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.warn("Invalid Paystack webhook signature");
    return res.status(401).send("Unauthorized");
  }

  // 2. Parse the event
  const event = JSON.parse(req.body);

  // 3. Only handle successful charges
  if (event.event === "charge.success") {
    const orderId = event.data.metadata?.orderId;

    if (!orderId) {
      console.warn("Webhook received but no orderId in metadata");
      return res.sendStatus(200);
    }

    try {
      // 4. Mark order as paid
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: "paid",
          status: "pending"
        },
        { returnDocument: "after" }
      );

      if (!updatedOrder) {
        console.warn("Webhook: Order not found for ID:", orderId);
        return res.sendStatus(200);
      }

      console.log(`Order ${updatedOrder.trackingId} marked as PAID ✅`);

      // 5. Send confirmation email to customer
      await sendOrderConfirmationEmail(updatedOrder);

      // 6. Send new order alert to owner
      await sendOwnerNotificationEmail(updatedOrder);

    } catch (err) {
      console.error("Webhook order update error:", err.message);
    }
  }

  // Always respond 200 to Paystack so it doesn't retry
  res.sendStatus(200);
});

module.exports = router;