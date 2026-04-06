const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const orderModel = require("../src/models/order.model");
const app = require("../src/app");

describe("GET /api/orders/:orderId", () => {
  let userId;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = "test_jwt_secret";
    userId = new mongoose.Types.ObjectId();
    token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1d" });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("returns 200 and the order when the authenticated user is the owner", async () => {
    const shippingAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "560001",
      country: "Testland",
    };

    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: "INR" } },
      ],
      totalPrice: { amount: 100, currency: "INR" },
      shippingAddress,
    });

    const res = await request(app)
      .get(`/api/orders/${created._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(res.body.order._id).toBe(created._id.toString());
    expect(res.body.order.user).toBe(userId.toString());
  });

  it("returns 404 when order is not found", async () => {
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/orders/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("returns 403 when authenticated user is not the owner", async () => {
    const otherUserId = new mongoose.Types.ObjectId();

    const created = await orderModel.create({
      user: otherUserId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 10, currency: "INR" } },
      ],
      totalPrice: { amount: 10, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "1", country: "y" },
    });

    const res = await request(app)
      .get(`/api/orders/${created._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it("returns 401 when no token is provided", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/orders/${id}`);
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when role is not allowed (middleware)", async () => {
    const sellerToken = jwt.sign({ _id: new mongoose.Types.ObjectId(), role: "seller" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/orders/${id}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when DB lookup fails", async () => {
    jest.spyOn(orderModel, "findById").mockRejectedValueOnce(new Error("DB fail"));

    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/orders/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });

  it("returns 400 for invalid orderId format", async () => {
    const res = await request(app)
      .get(`/api/orders/invalid-id`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });
});
