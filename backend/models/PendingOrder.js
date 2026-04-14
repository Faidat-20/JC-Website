const mongoose = require("mongoose");

const PendingOrderSchema = new mongoose.Schema({
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
  paystackReference: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // auto-delete after 24 hours
  }
});

module.exports = mongoose.model("PendingOrder", PendingOrderSchema);