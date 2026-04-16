const axios = require("axios");

async function initiatePaystackRefund(paystackReference, amount) {
  try {
    const response = await axios.post(
      "https://api.paystack.co/refund",
      {
        transaction: paystackReference,
        amount: amount * 100 // convert to kobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return { success: true, data: response.data };
  } catch (err) {
    console.error("Refund error:", err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

module.exports = { initiatePaystackRefund };