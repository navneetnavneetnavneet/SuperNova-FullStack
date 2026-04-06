const express = require("express");
const router = express.Router();
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validatorMiddleware = require("../middlewares/validator.middleware");
const orderController = require("../controllers/order.controller");

// POST /api/orders/
router.post(
  "/",
  createAuthMiddleware(["user"]),
  validatorMiddleware.createOrderValidations,
  orderController.createOrder,
);

// GET /api/orders/me
router.get("/me", createAuthMiddleware(["user"]), orderController.getMyOrders);

// GET /api/orders/:orderId
router.get(
  "/:orderId",
  createAuthMiddleware(["user"]),
  orderController.getOrderById,
);

// POST /api/orders/:orderId/cancel
router.post(
  "/:orderId/cancel",
  createAuthMiddleware(["user"]),
  orderController.cancelOrderById,
);

// PATCH /api/orders/:orderId/address
router.patch(
  "/:orderId/address",
  createAuthMiddleware(["user"]),
  validatorMiddleware.updateOrderAddressValidations,
  orderController.updateOrderAddress,
);

module.exports = router;
