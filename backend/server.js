const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const app = express();
// ← ADD THIS AT THE TOP
const { startAutoDeliverJob } = require("./utils/autoDeliver");

// MIDDLEWARE
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(cors());
app.use(bodyParser.json());

// TEST ROUTE
app.get("/", (_, res) => {
  res.send("Backend server is running!");
});

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB connected ✅");
  startAutoDeliverJob(); // ← CALL IT HERE
})
.catch(err => console.log("MongoDB connection error:", err));

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

const paymentRoute = require("./routes/payment");
app.use("/api/payment", paymentRoute);

const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

const ratingRoutes = require("./routes/ratings");
app.use("/api/ratings", ratingRoutes);

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));