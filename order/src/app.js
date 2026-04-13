const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const orderRoutes = require("./routes/order.routes");

// cookie-parser
app.use(cookieParser());

// body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// morgan
app.use(morgan("dev"));

// routes
app.use("/api/orders", orderRoutes);

// health check (no auth required)
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Order service is running" });
});

module.exports = app;
