const orderModel = require("../models/order.model");
const axios = require("axios");
const mongoose = require("mongoose");

module.exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    // fetch user cart from cart service
    const cartResponse = await axios.get(`http://localhost:8002/api/cart/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // fetch product details from product service
    const products = await Promise.all(
      cartResponse.data.cart.items.map(async (item) => {
        return (
          await axios.get(
            `http://localhost:8001/api/products/${item.productId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
        ).data.product;
      }),
    );

    let totalAmount = 0;

    const orderItems = cartResponse.data.cart.items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString(),
      );

      // if not in stock,doen not allow order creation
      if (!product.stock || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Product ${product.title} is out of stock or insufficient stock`,
        });
      }

      const itemTotal = product.price.amount * item.quantity;
      totalAmount = totalAmount + itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: {
          amount: itemTotal,
          currency: product.price.currency,
        },
      };
    });

    const order = await orderModel.create({
      user: user._id,
      items: orderItems,
      status: "PENDING",
      totalPrice: {
        amount: totalAmount,
        currency: "INR",
      },
      shippingAddress: req.body.shippingAddress,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getMyOrders = async (req, res) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await orderModel
      .find({ user: user._id })
      .skip(skip)
      .limit(limit);

    const totalOrders = await orderModel.countDocuments({ user: user._id });

    res.status(200).json({
      message: "Orders reterived successfully",
      orders,
      meta: {
        totalOrders,
        page,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden : You don't have to access this order",
      });
    }

    res.status(200).json({
      message: "Order reterive successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.cancelOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden : You don't have to access this order",
      });
    }

    // only pending orders can be cancelled
    if (order.status !== "PENDING") {
      return res.status(409).json({
        message: "Order cannot be cancelled at this time",
      });
    }

    order.status = "CANCELLED";
    order.timeline.push({ type: "CANCELLED", at: new Date() });
    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.updateOrderAddress = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).josn({ message: "Invalid order id" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden : You don't have to access this order",
      });
    }

    // only pending orders can be updated
    if (order.status !== "PENDING") {
      return res
        .status(409)
        .json({ message: "Order address cannot be updated at this time" });
    }

    order.shippingAddress = {
      street: req.body.shippingAddress.street,
      city: req.body.shippingAddress.city,
      state: req.body.shippingAddress.state,
      pincode: req.body.shippingAddress.pincode,
      country: req.body.shippingAddress.country,
    };
    await order.save();

    res.status(200).json({
      message: "Order address updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
