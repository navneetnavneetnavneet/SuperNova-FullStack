const express = require("express");
const router = express.Router();
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validatorMiddleware = require("../middlewares/validator.middleware");
const productController = require("../controllers/product.controller");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products/
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  validatorMiddleware.createProductValidations,
  productController.createProduct,
);

// GET /api/products
router.get("/", productController.getProducts);

// GET /api/products/seller
router.get(
  "/seller",
  createAuthMiddleware(["seller"]),
  productController.getProductsBySeller,
);

// GET /api/products/:id
router.get("/:id", productController.getProductById);

// PATCH /api/products/:id
router.patch(
  "/:id",
  createAuthMiddleware(["seller"]),
  productController.updateProduct,
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  createAuthMiddleware(["seller"]),
  productController.deleteProduct,
);

module.exports = router;
