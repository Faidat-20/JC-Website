const express = require("express");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");

// ----------------------
// SIGNUP / CHECK USER
// ----------------------
router.post("/check-or-create", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, isSubscribed: false, cart: [] });
      await user.save();
    }

    res.json({ success: true, userId: user._id, subscribed: user.isSubscribed, username: user.username || null  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// REQUEST OTP
// ----------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

router.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found. Subscribe first." });
    
    if (!user.isSubscribed) {
      return res.status(403).json({ message: "You must subscribe first before getting an OTP." });
    }

    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
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

    if (String(user.otp) !== String(otp)) return res.status(400).json({ message: "Incorrect OTP" });
    if (Date.now() > user.otpExpiry) return res.status(400).json({ message: "OTP expired" });

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
      username: user.username || "User",
      email: user.email,
      subscribed: user.isSubscribed,
      cart: user.cart || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// UPDATE CART
// ----------------------
router.post("/update-cart", async (req, res) => {
  const { userId, name, image, price, action, quantity } = req.body;
  if (!userId || !name || !action) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let cart = user.cart || [];
    let existingItem = cart.find(item => item.name === name);

    if (action === "add") {
      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        cart.push({ name, image, price, quantity: quantity || 1 });
      }
    } else if (action === "remove") {
      cart = cart.filter(item => item.name !== name);
    }
    else if (action === "update") {
      if (existingItem) {
        existingItem.quantity = quantity; // set exact quantity
        // Remove item if quantity is 0
        if (existingItem.quantity <= 0) {
          cart = cart.filter(item => item.name !== name);
        }
      }
    }

    user.cart = cart;
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// CLEAR CART
// ----------------------
router.post("/clear-cart", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.cart = [];
    await user.save();

    res.json({ success: true, message: "Cart cleared successfully", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// LOGOUT
// ----------------------
router.post("/logout", (req, res) => {
  // On JWT, the token cannot be destroyed, but frontend should remove it
  res.status(200).json({ message: "Logged out successfully" });
});

// ----------------------
// SUBSCRIBE NEWSLETTER (STEP 7.2) — CORRECTED
// ----------------------
router.post("/subscribe-newsletter", async (req, res) => {
  try {
    const { userId, email, username  } = req.body;

    if (!email && !userId) {
      return res.status(400).json({ success: false, message: "Email or User ID is required." });
    }

    let user;

    if (userId) {
      user = await User.findById(userId);
    }

    if (!user ) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({ email, username, isSubscribed: true, cart: [] });
      await user.save();
      return res.json({ success: true, message: "Subscription successful!" });
    }

    // Already subscribed?
    if (user.isSubscribed) {
      // Update username if missing
      if (!user.username && username) {
        user.username = username;
        await user.save();
      }
      return res.json({ success: true, message: "You are already subscribed! Login." });
    }
    if (!user.username && email && req.body.username) {
      user.username = req.body.username;
      await user.save();
    }
    if (user && !user.isSubscribed) {
      user.isSubscribed = true;
      if (username) user.username = username; // ← save username
      await user.save();
      return res.json({ success: true, message: "Subscription successful!" });
    }

    return res.json({ success: true, message: "Subscription successful!" });

  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;