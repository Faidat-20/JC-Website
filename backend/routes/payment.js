const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");

router.post("/", async (req, res) => {
  const { userId, cart, deliveryDetails, shipping, total } = req.body;

  try {
    // 1. Create the order in your DB first
    const newOrder = new Order({
      userId,
      items: cart,
      deliveryDetails,
      shippingFee: shipping,
      total,
      paymentStatus: "pending"
    });
    const savedOrder = await newOrder.save();

    // 2. Initialize Paystack with the correct fields
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: deliveryDetails.email,
        amount: total * 100,           // Paystack uses kobo, so multiply by 100
        callback_url: `${process.env.FRONTEND_URL}/order-success?orderId=${savedOrder._id}`,
        metadata: { orderId: savedOrder._id }
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

module.exports = router;