const cartModel = require("../models/cart.model");
const mongoose = require("mongoose");

module.exports.getCart = async (req, res) => {
  try {
    const user = req.user;

    let cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      cart = new cartModel({
        user: user._id,
        items: [],
      });
      await cart.save();
    }

    res.status(200).json({
      cart,
      totals: {
        totalItems: cart.items.length,
        totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const user = req.user;

    let cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      cart = new cartModel({
        user: user._id,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    res.status(200).json({
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.updateItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const user = req.user;

    const cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    if (existingItemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    } else {
      cart.items[existingItemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({
      message: "Cart item quantity updated successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.deleteItemFromCart = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    if (existingItemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items.splice(existingItemIndex, 1);
    await cart.save();

    res.status(200).json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.clearCart = async (req, res) => {
  try {
    const user = req.user;

    const cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
