const cron = require("node-cron");
const Order = require("../models/Order");
const { sendDeliveredEmail } = require("./mailer");
const ARCHIVE_AFTER_DAYS = 30;

function startAutoDeliverJob() {

  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find all shipped orders that were shipped more than 7 days ago
      const overdueOrders = await Order.find({
        status: "shipped",
        order_shipped_at: { $lte: sevenDaysAgo }
      });

      if (overdueOrders.length === 0) {

        return;
      }

      for (const order of overdueOrders) {
        order.status = "delivered";
        order.order_delivered_at = new Date();
        await order.save();
      }
      try { await sendDeliveredEmail(order); } catch (e) { console.error("Auto-deliver email error:", e); }

    } catch (err) {
      console.error("Auto-deliver job error:", err);
    }
  });


  // Clean up abandoned pending orders older than 24 hours
  const PendingOrder = require("../models/PendingOrder");

  cron.schedule("0 1 * * *", async () => {
    try {
      const result = await PendingOrder.deleteMany({
        createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
    } catch (err) {
      console.error("Pending order cleanup error:", err);
    }
  });
  // Auto-archive orders older than 30 days
  cron.schedule("0 1 * * *", async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_AFTER_DAYS);

      const ordersToArchive = await Order.find({
        isArchived: false,
        order_created_at: { $lte: cutoffDate }
      });

      if (ordersToArchive.length === 0) {
        return;
      }
      for (const order of ordersToArchive) {
        order.isArchived = true;
        order.order_archived_at = new Date();
        await order.save();
      }
    } catch (err) {
      console.error("Auto-archive error:", err);
    }
  });
}

module.exports = { startAutoDeliverJob };