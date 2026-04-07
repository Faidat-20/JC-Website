const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { sendShippedNotificationEmail, sendCancellationEmail } = require("../utils/mailer");
const { initiatePaystackRefund } = require("../utils/refund");

// ----------------------
// CREATE ORDER (pre-payment)
// ----------------------
router.post("/create", async (req, res) => {
  const { userId, items, deliveryDetails, shippingOption, subtotal, shippingFee, total } = req.body;

  if (!userId || !items || !deliveryDetails || !total) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const trackingId = "JC-" + Date.now() + "-" + Math.floor(Math.random() * 10000);

    const order = new Order({
      userId,
      items,
      deliveryDetails,
      shippingOption,
      subtotal,
      shippingFee,
      total,
      trackingId,
      status: "pending",
      paymentStatus: "pending"
    });

    await order.save();

    res.json({
      success: true,
      message: "Order created successfully!",
      orderId: order._id,
      trackingId: order.trackingId
    });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET ALL ORDERS (OWNER/ADMIN)
// ----------------------
router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().sort({ order_created_at: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET LATEST PAID ORDER BY USER
// Must be BEFORE /:orderId to avoid route conflict
// ----------------------
router.get("/user/:userId/latest-paid", async (req, res) => {
  try {
    const order = await Order.findOne({
      userId: req.params.userId,
      paymentStatus: "paid"
    }).sort({ createdAt: -1 });

    if (!order) return res.status(404).json({ success: false, message: "No paid orders found" });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Get latest paid order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET ORDERS BY USER
// ----------------------
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ order_created_at: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// TRACK ORDER BY TRACKING ID
// ----------------------
router.get("/track/:trackingId", async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.trackingId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error("Track order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET SINGLE ORDER
// ----------------------
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// UPDATE ORDER STATUS
// Used by admin AND by user (cancel only)
// ----------------------
router.put("/:orderId/status", async (req, res) => {
  const { status, requestingUserId } = req.body;

  if (!["pending", "shipped", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // ── User-initiated cancellation guard ──────────────────────
    // If requestingUserId is provided, this is a user cancel request.
    // Only allow if: the user owns the order, status is "pending", and it's paid.
    if (requestingUserId) {
      if (String(order.userId) !== String(requestingUserId)) {
        return res.status(403).json({ success: false, message: "You are not authorised to cancel this order." });
      }
      if (status !== "cancelled") {
        return res.status(403).json({ success: false, message: "Users can only cancel orders." });
      }
      if (order.status !== "pending") {
        return res.status(400).json({ success: false, message: "Only pending orders can be cancelled." });
      }
      if (order.paymentStatus !== "paid") {
        return res.status(400).json({ success: false, message: "This order has not been paid and cannot be refunded." });
      }
    }
    // ────────────────────────────────────────────────────────────

    order.status = status;

    if (status === "shipped") order.order_shipped_at = Date.now();
    if (status === "delivered") order.order_delivered_at = Date.now();

    await order.save();

    // Send shipped email
    if (status === "shipped") {
      try { await sendShippedNotificationEmail(order); } catch (e) { console.error("Shipped email error:", e); }
    }

    // Send cancellation email + initiate refund
    if (status === "cancelled") {
      try { await sendCancellationEmail(order); } catch (e) { console.error("Cancel email error:", e); }

      if (order.paymentStatus === "paid" && order.paystackReference) {
        const refundResult = await initiatePaystackRefund(order.paystackReference, order.total);
        if (refundResult.success) {
          console.log(`Refund initiated for order ${order.trackingId} ✅`);
          order.paymentStatus = "refund_initiated";
          await order.save();
        } else {
          console.error(`Refund failed for order ${order.trackingId}:`, refundResult.message);
        }
      }
    }

    res.json({ success: true, message: `Order marked as ${status}!`, order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;