const mongoose = require("mongoose");

const ShippingOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("ShippingOption", ShippingOptionSchema);