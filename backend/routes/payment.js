const express = require("express");
const router = express.Router();
const axios = require("axios"); // for API calls
const Order = require("../models/Order");

// INITIATE PAYMENT
router.post("/payment", async (req, res) => {
  const { email, amount, orderId, callback_url } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount, callback_url, metadata: { orderId } },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({ success: true, paymentLink: response.data.data.authorization_url });
  } catch (err) {
    console.error("Payment initiation error:", err);
    res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
});

module.exports = router;