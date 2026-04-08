const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports.verifyPaymentValidations = [
  body("razorpayOrderId")
    .notEmpty()
    .withMessage("Razorpay order ID is required"),
  body("paymentId").notEmpty().withMessage("Payment ID is required"),
  body("signature").notEmpty().withMessage("Signature is required"),
  respondWithValidationErrors,
];
