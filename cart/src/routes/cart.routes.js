const express = require("express");
const router = express.Router();
const validatorMiddleware = require("../middlewares/validator.middleware");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const cartController = require("../controllers/cart.controller");

// GET /api/cart
router.get("/", createAuthMiddleware(["user"]), cartController.getCart);

// POST /api/cart/items/
router.post(
  "/items",
  validatorMiddleware.addItemToCartValidations,
  createAuthMiddleware(["user"]),
  cartController.addItemToCart,
);

// PATCH /api/cart/items/:productId
router.patch(
  "/items/:productId",
  validatorMiddleware.updateItemToCartValidations,
  createAuthMiddleware(["user"]),
  cartController.updateItemQuantity,
);

// DELETE /api/cart/items/:productId
router.delete(
  "/items/:productId",
  createAuthMiddleware(["user"]),
  cartController.deleteItemFromCart,
);

// DELETE /api/cart/clear
router.delete(
  "/clear",
  createAuthMiddleware(["user"]),
  cartController.clearCart,
);

module.exports = router;
