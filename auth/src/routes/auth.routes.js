const express = require("express");
const router = express.Router();
const validator = require("../middlewares/validator.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

// POST /api/auth/register
router.post(
  "/register",
  validator.registerUserValidations,
  authController.registerUser,
);

// POST /api/auth/login
router.post("/login", validator.loginUserValidations, authController.loginUser);

// GET /api/auth/me
router.get("/me", authMiddleware.authUser, authController.getCurrentUser);

// GET /api/auth/logout
router.get("/logout", authController.logoutUser);

// GET /api/auth/users/me/addresses
router.get(
  "/users/me/addresses",
  authMiddleware.authUser,
  authController.getUserAddresses,
);

// POST /api/auth/users/me/addresses
router.post(
  "/users/me/addresses",
  authMiddleware.authUser,
  validator.addUserAddressValidations,
  authController.addUserAddress,
);

// DELETE /api/auth/users/me/addresses/:addressId
router.delete(
  "/users/me/addresses/:addressId",
  authMiddleware.authUser,
  authController.deleteUserAddress,
);

module.exports = router;
