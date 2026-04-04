const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");
const PendingOrder = require("../models/PendingOrder");
const { sendOrderConfirmationEmail, sendOwnerNotificationEmail } = require("../utils/mailer");

// ─────────────────────────────────────────
// INITIATE PAYMENT
// ─────────────────────────────────────────
router.post("/", async (req, res) => {
  const { userId, cart, deliveryDetails, shipping, total, shippingOption, subtotal } = req.body;

  try {
    // 1. Save to PendingOrder instead of Order
    const pendingOrder = new PendingOrder({
      userId,
      items: cart,
      deliveryDetails,
      shippingOption,
      subtotal,
      shippingFee: shipping,
      total
    });
    const savedPending = await pendingOrder.save();

    // 2. Initialize Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: deliveryDetails.email,
        amount: total * 100,
        callback_url: `${process.env.FRONTEND_URL}/order-success.html`,
        metadata: {
          pendingOrderId: String(savedPending._id)
        }
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

  // 1. Verify signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.warn("Invalid Paystack webhook signature");
    return res.status(401).send("Unauthorized");
  }

  // 2. Parse event
  const event = JSON.parse(req.body);

  if (event.event === "charge.success") {
    const pendingOrderId = event.data.metadata?.pendingOrderId;

    if (!pendingOrderId) {
      console.warn("Webhook: no pendingOrderId in metadata");
      return res.sendStatus(200);
    }

    try {
      // 3. Find the pending order
      const pending = await PendingOrder.findById(pendingOrderId);
      if (!pending) {
        console.warn("Webhook: PendingOrder not found:", pendingOrderId);
        return res.sendStatus(200);
      }

      // 4. Create real Order from pending order data
      const newOrder = new Order({
        userId: pending.userId,
        items: pending.items,
        deliveryDetails: pending.deliveryDetails,
        shippingOption: pending.shippingOption,
        subtotal: pending.subtotal,
        shippingFee: pending.shippingFee,
        total: pending.total,
        status: "pending",
        paymentStatus: "paid"
      });
      const savedOrder = await newOrder.save();

      console.log(`Order ${savedOrder.trackingId} created and marked as PAID ✅`);

      // 5. Delete the pending order
      await PendingOrder.findByIdAndDelete(pendingOrderId);

      // 6. Send confirmation emails
      await sendOrderConfirmationEmail(savedOrder);
      await sendOwnerNotificationEmail(savedOrder);

    } catch (err) {
      console.error("Webhook order creation error:", err.message);
    }
  }

  res.sendStatus(200);
});

module.exports = router;