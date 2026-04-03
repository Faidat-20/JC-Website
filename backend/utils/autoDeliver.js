const cron = require("node-cron");
const Order = require("../models/Order");

function startAutoDeliverJob() {

  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running auto-deliver check...");

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find all shipped orders that were shipped more than 7 days ago
      const overdueOrders = await Order.find({
        status: "shipped",
        order_shipped_at: { $lte: sevenDaysAgo }
      });

      if (overdueOrders.length === 0) {
        console.log("No overdue orders found.");
        return;
      }

      console.log(`Found ${overdueOrders.length} overdue order(s). Marking as delivered...`);

      for (const order of overdueOrders) {
        order.status = "delivered";
        order.order_delivered_at = new Date();
        await order.save();
        console.log(`Order ${order.trackingId} auto-marked as delivered ✅`);
      }

    } catch (err) {
      console.error("Auto-deliver job error:", err);
    }
  });

  console.log("Auto-deliver job scheduled ✅");
}

module.exports = { startAutoDeliverJob };