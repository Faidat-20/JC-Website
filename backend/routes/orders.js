const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ----------------------
// CREATE ORDER
// ----------------------
// CREATE ORDER (pre-payment)
router.post("/create", async (req, res) => {
  const { userId, items, deliveryDetails, shippingOption, subtotal, shippingFee, total } = req.body;

  // Basic validation
  if (!userId || !items || !deliveryDetails || !total) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Generate unique tracking ID
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
      status: "pending",        // order created but not processed
      paymentStatus: "pending"  // awaiting payment
    });

    await order.save();

    // Return the order info to frontend (you will send this to the payment gateway)
    res.json({ success: true, message: "Order created successfully!", orderId: order._id, trackingId: order.trackingId });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET ALL ORDERS (OWNER)
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
// UPDATE ORDER STATUS (OWNER)
// ----------------------
const { sendShippedNotificationEmail } = require("../utils/mailer");

router.put("/:orderId/status", async (req, res) => {
  const { status } = req.body;

  if (!["pending", "shipped", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;

    // Set timestamps based on status
    if (status === "shipped") order.order_shipped_at = Date.now();
    if (status === "delivered") order.order_delivered_at = Date.now();

    await order.save();

    // Send shipped email to customer
    if (status === "shipped") {
      await sendShippedNotificationEmail(order);
    }

    res.json({ success: true, message: `Order marked as ${status}!`, order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;