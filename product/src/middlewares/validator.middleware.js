const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports.createProductValidations = [
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description max length is 500 characters"),
  body("priceAmount")
    .notEmpty()
    .withMessage("Price amount is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Price amount must be a number > 0"),
  body("priceCurrency")
    .optional()
    .isString()
    .withMessage("Price currency must be a string")
    .isIn(["INR", "USD"])
    .withMessage("Price currency eigther be INR or USD"),
  respondWithValidationErrors,
];
