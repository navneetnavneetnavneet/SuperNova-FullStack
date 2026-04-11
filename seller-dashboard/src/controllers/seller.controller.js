const userModel = require("../models/user.model");
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model");
const paymentModel = require("../models/payment.model");

module.exports.getMetrics = async (req, res) => {
  try {
    const seller = req.user;

    // Get all products for this seller
    const products = await productModel.find({ seller: seller._id });
    const productIds = products.map((p) => p._id);

    // Get all orders containing seller's products
    const orders = await orderModel.find({
      "items.productId": { $in: productIds },
      status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
    });

    // Sales: total number of items sold
    let sales = 0;
    let revenue = 0;
    const productSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (productIds.includes(item.productId)) {
          sales += item.quantity;
          revenue += item.price.amount * item.quantity;
          productSales[item.productId] =
            (productSales[item.productId] || 0) + item.quantity;
        }
      });
    });

    // Top products by quantity sold
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const prod = products.find((p) => p._id.equals(productId));
        return prod
          ? { id: prod._id, title: prod.title, sold: quantity }
          : null;
      })
      .filter(Boolean);

    res.status(200).json({
      sales,
      revenue,
      topProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    const seller = req.user;

    // Get all products for this seller
    const products = await productModel.find({ seller: seller._id });
    const productIds = products.map((p) => p._id.toString());

    // Get all orders containing seller's products
    const orders = await orderModel
      .find({
        "items.productId": { $in: productIds },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    // Filter order items to only include those from this seller
    const filteredOrders = orders
      .map((order) => {
        const filteredItems = order.items.filter((item) =>
          productIds.includes(item.productId.toString()),
        );

        return {
          ...order.toObject(),
          items: filteredItems,
        };
      })
      .filter((order) => order.items.length > 0);

    return res.status(200).json(filteredOrders);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getProducts = async (req, res) => {
  try {
    const seller = req.user;

    const products = await productModel
      .find({ seller: seller._id })
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
