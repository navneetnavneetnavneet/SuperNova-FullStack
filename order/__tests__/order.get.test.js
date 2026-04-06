const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const orderModel = require("../src/models/order.model");
const app = require("../src/app");

describe("GET /api/orders/me", () => {
  let userId;
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = "test_jwt_secret";
    userId = new mongoose.Types.ObjectId();
    token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("returns 200 and only the authenticated user's orders with default pagination", async () => {
    const otherUserId = new mongoose.Types.ObjectId();

    const shippingAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "560001",
      country: "Testland",
    };

    await orderModel.create([
      {
        user: userId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: { amount: 100, currency: "INR" },
          },
        ],
        totalPrice: { amount: 100, currency: "INR" },
        shippingAddress,
      },
      {
        user: userId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: { amount: 50, currency: "INR" },
          },
        ],
        totalPrice: { amount: 100, currency: "INR" },
        shippingAddress,
      },
      {
        user: otherUserId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: { amount: 10, currency: "INR" },
          },
        ],
        totalPrice: { amount: 10, currency: "INR" },
        shippingAddress,
      },
    ]);

    const res = await request(app)
      .get("/api/orders/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.meta.totalOrders).toBe(2);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
  });

  it("supports pagination via page & limit query params", async () => {
    const total = 12;
    const shippingAddress = {
      street: "Addr",
      city: "City",
      state: "ST",
      pincode: "000000",
      country: "C",
    };

    const docs = Array.from({ length: total }).map(() => ({
      user: userId,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: { amount: 10, currency: "INR" },
        },
      ],
      totalPrice: { amount: 10, currency: "INR" },
      shippingAddress,
    }));

    await orderModel.create(docs);

    const res = await request(app)
      .get("/api/orders/me?page=2&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.orders).toHaveLength(5);
    expect(res.body.meta.totalOrders).toBe(total);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.limit).toBe(5);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/orders/me");
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when role is not 'user'", async () => {
    const sellerToken = jwt.sign(
      { _id: new mongoose.Types.ObjectId(), role: "seller" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const res = await request(app)
      .get("/api/orders/me")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when DB query fails", async () => {
    jest.spyOn(orderModel, "find").mockImplementationOnce(() => {
      throw new Error("DB fail");
    });

    const res = await request(app)
      .get("/api/orders/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
