const express = require("express");
const router = express.Router();
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validatorMiddleware = require("../middlewares/validator.middleware");
const paymentController = require("../controllers/payment.controller");

// POST /api/payments/create/:orderId
router.post(
  "/create/:orderId",
  createAuthMiddleware(["user"]),
  paymentController.createPayment,
);

// POST /api/payments/verify
router.post(
  "/verify",
  createAuthMiddleware(["user"]),
  validatorMiddleware.verifyPaymentValidations,
  paymentController.verifyPayment,
);

module.exports = router;
