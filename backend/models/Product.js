const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  page: {
    type: String
  },
  inStock: {
    type: Boolean,
    default: true
  },
  hasVariants: {
    type: Boolean,
    default: false
  },
  variantType: {
    type: String,
    enum: ["size", "color", "quantity", "custom"],
    default: null
  },
  variants: [
    {
      label: String,
      price: Number,
      inStock: { type: Boolean, default: true }
    }
  ],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);