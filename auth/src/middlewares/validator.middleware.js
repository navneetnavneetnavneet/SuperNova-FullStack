const { body, validationResult } = require("express-validator");

const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports.registerUserValidations = [
  body("username")
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3 })
    .withMessage("Username must be atleast 3 characters long"),
  body("email")
    .isString()
    .withMessage("Email must be a string")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 characters long"),
  body("fullName.firstName")
    .isString()
    .withMessage("First Name must be a string")
    .notEmpty()
    .withMessage("First Name is required"),
  body("fullName.lastName")
    .isString()
    .withMessage("Last Name must be a string")
    .notEmpty()
    .withMessage("Last Name is required"),
  body("role")
    .optional()
    .isString()
    .withMessage("Role must be a string")
    .isIn(["user", "seller"])
    .withMessage("Role must be eigther (user or seller)"),
  respondWithValidationErrors,
];

module.exports.loginUserValidations = [
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3 })
    .withMessage("Username must be atleast 3 characters long"),
  body("email")
    .optional()
    .isString()
    .withMessage("Email must be a string")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 characters long"),
  (req, res, next) => {
    if (!req.body.username && !req.body.email) {
      return res.status(400).json({
        errors: [
          {
            msg: "Eigther username or email is required",
            param: "username/email",
            location: "body",
          },
        ],
      });
    }
    respondWithValidationErrors(req, res, next);
  },
];

module.exports.addUserAddressValidations = [
  body("street")
    .isString()
    .withMessage("Street must be a string")
    .notEmpty()
    .withMessage("Street is required"),
  body("city")
    .isString()
    .withMessage("City must be a string")
    .notEmpty()
    .withMessage("City is required"),
  body("state")
    .isString()
    .withMessage("State must be a string")
    .notEmpty()
    .withMessage("State is required"),
  body("pincode")
    .isString()
    .withMessage("Pincode must be a string")
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 characters long"),
  body("country")
    .isString()
    .withMessage("Country must be a string")
    .notEmpty()
    .withMessage("Country is required"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
  respondWithValidationErrors,
];
