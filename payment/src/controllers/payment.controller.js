const paymentModel = require("../models/payment.model");
const mongoose = require("mongoose");
const axios = require("axios");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports.createPayment = async (req, res) => {
  try {
    const user = req.user;
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    // fetch order details from order service
    const orderResponse = await axios.get(
      `http://localhost:8003/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const price = orderResponse.data.order.totalPrice;

    const order = await razorpay.orders.create(price);

    const payment = await paymentModel.create({
      order: orderId,
      user: user._id,
      razorpayOrderId: order.id,
      price: {
        amount: order.amount,
        currency: order.currency,
      },
    });

    res.status(201).json({
      message: "Payment initiated successfully",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");

    const isValid = validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: paymentId },
      signature,
      secret,
    );

    if (!isValid) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const payment = await paymentModel.findOne({
      razorpayOrderId,
      status: "PENDING",
    });

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = "COMPLETED";

    await payment.save();

    res.status(200).json({
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
