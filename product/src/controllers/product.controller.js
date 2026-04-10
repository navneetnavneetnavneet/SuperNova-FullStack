const productModel = require("../models/product.model");
const imagekitService = require("../services/imagekit.service");
const mongoose = require("mongoose");
const { publishToQueue } = require("../broker/broker");

module.exports.createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency = "INR" } = req.body;

    const seller = req.user._id;

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    const images = await Promise.all(
      (req.files || []).map((file) =>
        imagekitService.uploadImage(file.buffer, file.originalname),
      ),
    );

    const product = await productModel.create({
      title,
      description,
      price,
      seller,
      images,
    });

    await publishToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", {
      email: req.user.email,
      username: req.user.username,
      productId: product._id,
      seller: seller,
    });

    res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getProducts = async (req, res) => {
  try {
    const { q, minPrice, maxPrice, skip = 0, limit = 20 } = req.query;

    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    if (minPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $gte: Number(minPrice),
      };
    }

    if (maxPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $lte: Number(maxPrice),
      };
    }

    const products = await productModel
      .find(filter)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    res.status(200).json({
      message: "Products reterived successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product reterive successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server.error",
      error: error.message,
    });
  }
};

module.exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await productModel.findOne({ _id: id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own products",
      });
    }

    const allowedUpdates = ["title", "description", "price"];
    for (const key of Object.keys(req.body || {})) {
      if (allowedUpdates.includes(key)) {
        if (key === "price" && typeof req.body.price === "object") {
          if (req.body.price.amount !== undefined) {
            product.price.amount = req.body.price.amount;
          }
          if (req.body.price.currency !== undefined) {
            product.price.currency = req.body.price.currency;
          }
        } else {
          product[key] = req.body[key];
        }
      }
    }

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await productModel.findOne({ _id: id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own products",
      });
    }

    await productModel.findOneAndDelete({ _id: product._id });

    res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getProductsBySeller = async (req, res) => {
  try {
    const seller = req.user;
    const { skip = 0, limit = 20 } = req.query;

    const products = await productModel
      .find({ seller: seller._id })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    res.status(200).json({
      message: "Products reterived successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
