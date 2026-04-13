const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const sellerRoutes = require("./routes/seller.routes");

// cookie-parser
app.use(cookieParser());

// body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// morgan
app.use(morgan("dev"));

// routes
app.use("/api/seller/dashboard", sellerRoutes);

// health check (no auth required)
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Seller Dashboard service is running" });
});

module.exports = app;
