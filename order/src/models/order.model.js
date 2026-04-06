const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        price: {
          amount: {
            type: Number,
            required: true,
          },
          currency: {
            type: String,
            required: true,
            enum: ["INR", "USD"],
          },
        },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "SHIPPED", "DELIVERED"],
    },
    timeline: [
      {
        type: {
          type: String,
          enum: ["PENDING", "CONFIRMED", "CANCELLED", "SHIPPED", "DELIVERED"],
        },
        at: { type: Date, default: Date.now },
      },
    ],
    totalPrice: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        enum: ["INR", "USD"],
      },
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
