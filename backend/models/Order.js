const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      name: String,
      image: String,
      price: Number,
      quantity: Number
    }
  ],

  deliveryDetails: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    address: String,
    country: String,
    state: String,
    city: String
  },

  shippingOption: {
    name: String,
    price: Number
  },

  subtotal: Number,
  shippingFee: Number,
  total: Number,

  status: {
    type: String,
    enum: ["pending", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  trackingId: {
    type: String,
    unique: true,
    default: () => "TRK-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase()
  },

  paystackReference: {
    type: String
  },
  order_created_at: {
    type: Date,
    default: Date.now
  },

  order_shipped_at: {
    type: Date
  },

  order_delivered_at: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);