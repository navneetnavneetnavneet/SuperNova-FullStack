const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");

jest.mock("axios");

const mockCreate = jest.fn();

jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: mockCreate,
    },
  }));
});

const app = require("../src/app");

const generateToken = (payload = {
  _id: new mongoose.Types.ObjectId().toHexString(),
  role: "user",
}) => jwt.sign(payload, process.env.JWT_SECRET);

describe("POST /api/payments/create/:orderId", () => {
  let token;

  beforeEach(() => {
    token = generateToken();
    axios.get.mockReset();
    mockCreate.mockReset();
  });

  it("creates a payment and stores Razorpay order data", async () => {
    const orderId = new mongoose.Types.ObjectId().toHexString();

    axios.get.mockResolvedValueOnce({
      data: {
        order: {
          totalPrice: 1000,
        },
      },
    });

    mockCreate.mockResolvedValueOnce({
      id: "order_123",
      amount: 1000,
      currency: "INR",
    });

    const response = await request(app)
      .post(`/api/payments/create/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/payment initiated successfully/i);
    expect(response.body.payment).toMatchObject({
      order: orderId,
      razorpayOrderId: "order_123",
      price: {
        amount: 1000,
        currency: "INR",
      },
    });
  });

  it("returns 400 for invalid order id", async () => {
    const response = await request(app)
      .post("/api/payments/create/invalid-order-id")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid order id/i);
  });
});
