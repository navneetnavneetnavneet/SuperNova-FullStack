const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports.createOrderValidations = [
  body("shippingAddress.street")
    .isString()
    .withMessage("Street must be a string")
    .notEmpty()
    .withMessage("Street is required"),
  body("shippingAddress.city")
    .isString()
    .withMessage("City must be a string")
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .isString()
    .withMessage("State must be a string")
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("Pincode must be a string")
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 characters long"),
  body("shippingAddress.country")
    .isString()
    .withMessage("Country must be a string")
    .notEmpty()
    .withMessage("Country is required"),
  respondWithValidationErrors,
];

module.exports.updateOrderAddressValidations = [
  body("shippingAddress.street")
    .isString()
    .withMessage("Street must be a string")
    .notEmpty()
    .withMessage("Street is required"),
  body("shippingAddress.city")
    .isString()
    .withMessage("City must be a string")
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .isString()
    .withMessage("State must be a string")
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("Pincode must be a string")
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 characters long"),
  body("shippingAddress.country")
    .isString()
    .withMessage("Country must be a string")
    .notEmpty()
    .withMessage("Country is required"),
  respondWithValidationErrors,
];
