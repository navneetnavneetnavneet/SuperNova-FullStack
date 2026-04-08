const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const mockCreate = jest.fn();

jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: mockCreate,
    },
  }));
});

jest.mock("razorpay/dist/utils/razorpay-utils", () => ({
  validatePaymentVerification: jest.fn(),
}));

const {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");

validatePaymentVerification.mockReturnValueOnce(true);

const app = require("../src/app");
const paymentModel = require("../src/models/payment.model");

const generateToken = (payload = {
  _id: new mongoose.Types.ObjectId().toHexString(),
  role: "user",
}) => jwt.sign(payload, process.env.JWT_SECRET);

describe("POST /api/payments/verify", () => {
  let token;

  beforeEach(() => {
    token = generateToken();
    validatePaymentVerification.mockReset();
  });

  it("verifies payment signature and completes the payment record", async () => {
    validatePaymentVerification.mockReturnValueOnce(true);

    const payment = await paymentModel.create({
      order: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      razorpayOrderId: "order_123",
      status: "PENDING",
      price: {
        amount: 1000,
        currency: "INR",
      },
    });

    const response = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpayOrderId: "order_123",
        paymentId: "pay_456",
        signature: "valid_signature",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/payment verified successfully/i);
    expect(response.body.payment).toMatchObject({
      razorpayOrderId: "order_123",
      paymentId: "pay_456",
      signature: "valid_signature",
      status: "COMPLETED",
    });

    const updated = await paymentModel.findById(payment._id);
    expect(updated.status).toBe("COMPLETED");
    expect(updated.paymentId).toBe("pay_456");
  });

  it("returns 400 when Razorpay signature validation fails", async () => {
    validatePaymentVerification.mockReturnValueOnce(false);

    const response = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpayOrderId: "order_123",
        paymentId: "pay_456",
        signature: "invalid_signature",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid signature/i);
  });
});
