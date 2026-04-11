const express = require("express");
const router = express.Router();
const createAuthMiddleware = require("../middlewares/auth.middleware");
const sellerController = require("../controllers/seller.controller");

// GET /api/seller/dashboard/metrics
router.get(
  "/metrics",
  createAuthMiddleware(["seller"]),
  sellerController.getMetrics,
);

// GET /api/seller/dashboard/orders
router.get(
  "/orders",
  createAuthMiddleware(["seller"]),
  sellerController.getOrders,
);

// GET /api/seller/dashboard/products
router.get(
  "/products",
  createAuthMiddleware(["seller"]),
  sellerController.getProducts,
);

module.exports = router;
