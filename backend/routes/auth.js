const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ----------------------
// SIGNUP / CHECK USER
// ----------------------
router.post("/check-or-create", async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });

    try {
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user if not exists
            user = new User({ email, subscribed: false, cart: [] });
            await user.save();
        }

        res.json({ success: true, userId: user._id, subscribed: user.subscribed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;

const nodemailer = require("nodemailer");

// Helper to generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

// ----------------------
// REQUEST OTP
// ----------------------
router.post("/request-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found. Subscribe first." });

        const otp = generateOTP();
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}. Expires in 5 minutes.`
        });

        res.json({ success: true, message: "OTP sent successfully." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ----------------------
// VERIFY OTP
// ----------------------
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.otp !== Number(otp)) return res.status(400).json({ message: "Incorrect OTP" });
        if (Date.now() > user.otpExpiry) return res.status(400).json({ message: "OTP expired" });

        // OTP is correct → clear it
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.json({ success: true, message: "Login successful", userId: user._id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ----------------------
// GET USER DATA
// ----------------------
router.get("/userdata/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      email: user.email,
      subscribed: user.subscribed,
      cart: user.cart || []
      // add wishlist or other user-specific fields here
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// CLEAR CART
// ----------------------
router.post("/clear-cart", async (req, res) => {

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID required"
    });
  }

  try {

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Clear cart
    user.cart = [];

    await user.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cart: user.cart
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});