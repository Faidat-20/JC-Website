const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/mailer");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// ─────────────────────────────────────────
// SANITIZATION HELPERS
// ─────────────────────────────────────────
function sanitizeText(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`]/g, "")
    .replace(/\s+/g, " ")
    .substring(0, maxLength);
}

function sanitizeEmail(value) {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().toLowerCase().substring(0, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : null;
}

function sanitizeOTP(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const cleaned = String(value).trim().replace(/\D/g, "");
  return cleaned.length === 6 ? cleaned : null;
}

// ─────────────────────────────────────────
// OTP RATE LIMITER
// Max 3 OTP requests per 10 minutes per email
// ─────────────────────────────────────────
const OTP_MAX_REQUESTS = 3;
const OTP_WINDOW_MS = 10 * 60 * 1000;
const otpRateLimitMap = new Map();

function checkOtpRateLimit(email) {
  const now = Date.now();
  const entry = otpRateLimitMap.get(email);

  if (!entry || now - entry.windowStart > OTP_WINDOW_MS) {
    otpRateLimitMap.set(email, { count: 1, windowStart: now });
    return { allowed: true, remaining: OTP_MAX_REQUESTS - 1 };
  }
  if (entry.count >= OTP_MAX_REQUESTS) {
    const retryAfterMin = Math.ceil((OTP_WINDOW_MS - (now - entry.windowStart)) / 60000);
    return { allowed: false, retryAfterMin };
  }
  entry.count++;
  return { allowed: true, remaining: OTP_MAX_REQUESTS - entry.count };
}

// Clean up stale entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpRateLimitMap.entries()) {
    if (now - entry.windowStart > OTP_WINDOW_MS) otpRateLimitMap.delete(email);
  }
}, 15 * 60 * 1000);

// ----------------------
// GENERATE UNIQUE USERNAME
// ----------------------
async function generateUniqueUsername(baseUsername) {
  if (!baseUsername) return null;

  const cleanBase = baseUsername.trim().toLowerCase().replace(/\s+/g, "");

  // Check if base username already exists
  let existing = await User.findOne({ username: cleanBase });
  if (!existing) return cleanBase;

  let counter = 1;
  let newUsername = `${cleanBase}${String(counter).padStart(3, "0")}`;

  while (await User.findOne({ username: newUsername })) {
    counter++;
    newUsername = `${cleanBase}${String(counter).padStart(3, "0")}`;
  }

  return newUsername;
}
// ----------------------
// SIGNUP / CHECK USER
// ----------------------
router.post("/check-or-create", async (req, res) => {
  const email = sanitizeEmail(req.body.email);
  if (!email) return res.status(400).json({ success: false, message: "A valid email is required." });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, userId: null, subscribed: false, username: null });
    }

    res.json({ success: true, userId: user._id, subscribed: user.isSubscribed, username: user.username || null });
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
  const email = sanitizeEmail(req.body.email);
  if (!email) return res.status(400).json({ success: false, message: "A valid email is required." });

  const limitResult = checkOtpRateLimit(email);
  if (!limitResult.allowed) {
    return res.status(429).json({
      success: false,
      message: `Too many OTP requests. Please wait ${limitResult.retryAfterMin} minute${limitResult.retryAfterMin !== 1 ? "s" : ""} before trying again.`
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found. Subscribe first." });
    
    if (!user.isSubscribed) {
      return res.status(403).json({ message: "You must subscribe first before getting an OTP." });
    }

    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    
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
  const email = sanitizeEmail(req.body.email);
  const otp = sanitizeOTP(req.body.otp);
  if (!email) return res.status(400).json({ success: false, message: "A valid email is required." });
  if (!otp) return res.status(400).json({ success: false, message: "OTP must be a 6-digit number." });

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
        existingItem.quantity = quantity;
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
  res.status(200).json({ message: "Logged out successfully" });
});

// ----------------------
// SUBSCRIBE NEWSLETTER
// ----------------------
router.post("/subscribe-newsletter", async (req, res) => {
  try {
    const { userId } = req.body;
    const email = sanitizeEmail(req.body.email);
    const username = sanitizeText(req.body.username || "", 50);

    if (!email && !userId) {
      return res.status(400).json({ success: false, message: "Email or User ID is required." });
    }
    if (req.body.email && !email) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    let user;

    // Find user by userId first
    if (userId) {
      user = await User.findById(userId);
    }

    // Then try by email (case-insensitive fallback)
    if (!user && email) {
      user = await User.findOne({ email: email });
      if (!user) {
        user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
      }
    }

    // User exists and already subscribed
    if (user && user.isSubscribed) {
      if (!user.username && username) {
        user.username = await generateUniqueUsername(username);
        await user.save();
      }
      return res.json({ success: true, message: "You are already subscribed! Login." });
    }

    // User exists but not subscribed yet — update them
    if (user && !user.isSubscribed) {
      user.isSubscribed = true;
      const generatedUsername = await generateUniqueUsername(username);
      if (username) user.username = generatedUsername;
      await user.save();
      // Send welcome email
      try { await sendWelcomeEmail(user.email, user.username); } catch (e) { console.error("Welcome email error:", e); }
      return res.json({ success: true, message: "Subscription successful!" });
    }

    try {
      // User doesn't exist at all — create them
      const uniqueUsername = await generateUniqueUsername(username);
      const isAdmin = email === process.env.ADMIN_EMAIL;

      user = new User({
        email,
        username: uniqueUsername,
        isSubscribed: true,
        isAdmin,
        cart: []
      });

      await user.save();

      // Send welcome email
      try { await sendWelcomeEmail(email, uniqueUsername); } catch (e) { console.error("Welcome email error:", e); }

      return res.json({ success: true, message: "Subscription successful!" });
    } catch (createErr) {
      if (createErr.code === 11000) {
        user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
        if (user) {
          if (!user.isSubscribed) {
            user.isSubscribed = true;
            if (username && !user.username) {
              user.username = await generateUniqueUsername(username);
            }
            await user.save();
            try { await sendWelcomeEmail(user.email, user.username); } catch (e) { console.error("Welcome email error:", e); }
            return res.json({ success: true, message: "Subscription successful!" });
          }
          return res.json({ success: true, message: "You are already subscribed! Login." });
        }
      }
      throw createErr;
    }

  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ----------------------
// SAVE DELIVERY DETAILS
// ----------------------
router.post("/save-delivery", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

  const raw = req.body.deliveryDetails || {};
  const deliveryDetails = {
    firstName: sanitizeText(raw.firstName, 50),
    lastName:  sanitizeText(raw.lastName, 50),
    phone:     sanitizeText(raw.phone, 20).replace(/[^0-9+\-\s()]/g, ""),
    email:     sanitizeEmail(raw.email) || "",
    address:   sanitizeText(raw.address, 300),
    country:   sanitizeText(raw.country, 60),
    state:     sanitizeText(raw.state, 60),
    city:      sanitizeText(raw.city, 60)
  };

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.deliveryDetails = deliveryDetails;
    await user.save();

    res.json({ success: true, message: "Delivery details saved!", deliveryDetails: user.deliveryDetails });
  } catch (err) {
    console.error("Save delivery error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET DELIVERY DETAILS
// ----------------------
router.get("/delivery-details/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, deliveryDetails: user.deliveryDetails || null });
  } catch (err) {
    console.error("Get delivery error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// SAVE SHIPPING OPTION
// ----------------------
router.post("/save-shipping", async (req, res) => {
  const { userId, shippingOption } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.shippingOption = shippingOption;
    await user.save();

    res.json({ success: true, message: "Shipping option saved!", shippingOption: user.shippingOption });
  } catch (err) {
    console.error("Save shipping error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET SHIPPING OPTION
// ----------------------
router.get("/shipping-option/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, shippingOption: user.shippingOption || null });
  } catch (err) {
    console.error("Get shipping error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// CHECK IF USER IS ADMIN
// ----------------------
router.post("/check-admin", async (req, res) => {

  console.log("CHECK ADMIN BODY:", req.body);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

  try {
    const user = await User.findById(userId);
    console.log("USER FOUND:", user);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isAdmin) {
      console.log("NOT ADMIN");
      return res.status(403).json({ success: false, message: "Access denied. Not an admin." });
    }
    console.log("IS ADMIN");
    res.json({ success: true, message: "Welcome Admin" });
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
module.exports = router;
