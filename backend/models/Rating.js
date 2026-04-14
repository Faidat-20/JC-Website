const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    default: "Anonymous"
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    default: ""
  },
  rating_created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent user from rating same product in same order twice
RatingSchema.index({ productId: 1, orderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", RatingSchema);