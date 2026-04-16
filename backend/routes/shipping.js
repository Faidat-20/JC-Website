const express = require("express");
const router = express.Router();
const ShippingOption = require("../models/ShippingOption");

// GET all active (for checkout)
router.get("/", async (req, res) => {
  try {
    const options = await ShippingOption.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, options });
  } catch (err) {
    console.error("Get shipping options error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET all including inactive (for admin)
router.get("/all", async (req, res) => {
  try {
    const options = await ShippingOption.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, options });
  } catch (err) {
    console.error("Get all shipping options error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ADD
router.post("/", async (req, res) => {
  const { name, desc, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }
  try {
    const option = new ShippingOption({ name, desc: desc || "", price });
    await option.save();
    res.json({ success: true, option });
  } catch (err) {
    console.error("Add shipping option error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const { name, desc, price, isActive } = req.body;
  try {
    const option = await ShippingOption.findByIdAndUpdate(
      req.params.id,
      { name, desc, price, isActive },
      { new: true }
    );
    if (!option) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, option });
  } catch (err) {
    console.error("Update shipping option error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await ShippingOption.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete shipping option error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;