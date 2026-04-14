const express = require("express");
const router = express.Router();
const Rating = require("../models/Rating");
const Product = require("../models/Product");

// ----------------------
// SUBMIT A RATING
// ----------------------
router.post("/", async (req, res) => {
  const { productId, orderId, userId, username, rating, review } = req.body;

  if (!productId || !orderId || !userId || !rating) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Save the rating
    const newRating = new Rating({
      productId,
      orderId,
      userId,
      username: username || "Anonymous",
      rating,
      review
    });
    await newRating.save();

    // Recalculate average rating for the product
    const allRatings = await Rating.find({ productId });
    const average = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(average * 10) / 10,
      totalRatings: allRatings.length
    });

    res.json({ success: true, message: "Rating submitted successfully!" });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already rated this product for this order." });
    }
    console.error("Submit rating error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET RATINGS FOR A PRODUCT
// ----------------------
router.get("/:productId", async (req, res) => {
  try {
    const ratings = await Rating.find({ productId: req.params.productId })
      .sort({ rating_created_at: -1 });

    res.json({ success: true, ratings });
  } catch (err) {
    console.error("Get ratings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// CHECK IF USER ALREADY RATED A PRODUCT FOR AN ORDER
// ----------------------
router.get("/check/:orderId/:productId/:userId", async (req, res) => {
  try {
    const existing = await Rating.findOne({
      orderId: req.params.orderId,
      productId: req.params.productId,
      userId: req.params.userId
    });
    res.json({ success: true, alreadyRated: !!existing });
  } catch (err) {
    console.error("Check rating error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET SINGLE RATING BY ORDER + PRODUCT + USER
// ----------------------
router.get("/get/:orderId/:productId/:userId", async (req, res) => {
  try {
    const rating = await Rating.findOne({
      orderId: req.params.orderId,
      productId: req.params.productId,
      userId: req.params.userId
    });
    res.json({ success: true, rating });
  } catch (err) {
    console.error("Get single rating error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;