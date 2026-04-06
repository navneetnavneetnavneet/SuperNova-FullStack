const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const orderModel = require("../src/models/order.model");
const app = require("../src/app");

jest.mock("axios");

const generateToken = (role = "user") => {
  return jwt.sign(
    {
      _id: new mongoose.Types.ObjectId(),
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

describe("POST /api/orders/", () => {
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = "test_jwt_secret";
    token = generateToken("user");
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("creates an order (happy path) and returns 201", async () => {
    const cartResponse = {
      data: {
        cart: {
          items: [
            { productId: new mongoose.Types.ObjectId().toString(), quantity: 2 },
            { productId: new mongoose.Types.ObjectId().toString(), quantity: 1 },
          ],
        },
      },
    };

    // axios.get called first for cart, then once per product
    axios.get
      .mockResolvedValueOnce(cartResponse) // cart service
      .mockResolvedValueOnce({
        data: { product: { _id: cartResponse.data.cart.items[0].productId, title: "P1", price: { amount: 100, currency: "INR" }, stock: 5 } },
      }) // product 1
      .mockResolvedValueOnce({
        data: { product: { _id: cartResponse.data.cart.items[1].productId, title: "P2", price: { amount: 200, currency: "INR" }, stock: 3 } },
      }); // product 2

    const shippingAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "560001",
      country: "Testland",
    };

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.statusCode).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.items).toHaveLength(2);
    // total = 2*100 + 1*200 = 400
    expect(res.body.order.totalPrice.amount).toBe(400);
    expect(res.body.order.totalPrice.currency).toBe("INR");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).post("/api/orders/").send({});
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when role is not 'user'", async () => {
    const sellerToken = generateToken("seller");

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
  });

  it("returns 400 when shippingAddress validation fails", async () => {
    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { city: "X" } });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 when a product is out of stock", async () => {
    const pid = new mongoose.Types.ObjectId().toString();
    const cartResponse = {
      data: { cart: { items: [{ productId: pid, quantity: 2 }] } },
    };

    axios.get
      .mockResolvedValueOnce(cartResponse) // cart
      .mockResolvedValueOnce({
        data: { product: { _id: pid, title: "P-out", price: { amount: 50, currency: "INR" }, stock: 1 } },
      }); // product with insufficient stock

    const shippingAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "560001",
      country: "Testland",
    };

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/out of stock/i);
  });

  it("returns 500 when DB create fails", async () => {
    const pid = new mongoose.Types.ObjectId().toString();
    const cartResponse = {
      data: { cart: { items: [{ productId: pid, quantity: 1 }] } },
    };

    axios.get
      .mockResolvedValueOnce(cartResponse)
      .mockResolvedValueOnce({
        data: { product: { _id: pid, title: "P1", price: { amount: 100, currency: "INR" }, stock: 5 } },
      });

    jest.spyOn(orderModel, "create").mockRejectedValueOnce(new Error("DB fail"));

    const shippingAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "560001",
      country: "Testland",
    };

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(res.statusCode).toBe(500);
  });
});
