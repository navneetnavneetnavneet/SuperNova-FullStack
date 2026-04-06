const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const orderModel = require("../src/models/order.model");
const app = require("../src/app");

describe("PATCH /api/orders/:orderId/address", () => {
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

  it("updates shippingAddress for a pending order (happy path) and returns 200", async () => {
    const oldAddress = {
      street: "Old St",
      city: "Oldcity",
      state: "OS",
      pincode: "560001",
      country: "Oldland",
    };

    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: "INR" } },
      ],
      status: "PENDING",
      timeline: [{ type: "PENDING", at: new Date() }],
      totalPrice: { amount: 100, currency: "INR" },
      shippingAddress: oldAddress,
    });

    const newAddress = {
      street: "New St",
      city: "Newcity",
      state: "NS",
      pincode: "560002",
      country: "Newland",
    };

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: newAddress });

    expect(res.statusCode).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.shippingAddress).toMatchObject(newAddress);
  });

  it("returns 400 for invalid orderId format", async () => {
    const res = await request(app)
      .patch(`/api/orders/invalid-id/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "x" } });

    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when order is not found", async () => {
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/orders/${id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(404);
  });

  it("returns 403 when authenticated user is not the owner", async () => {
    const otherUserId = new mongoose.Types.ObjectId();

    const created = await orderModel.create({
      user: otherUserId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 10, currency: "INR" } },
      ],
      status: "PENDING",
      totalPrice: { amount: 10, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(403);
  });

  it("returns 409 when order status is not PENDING", async () => {
    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 50, currency: "INR" } },
      ],
      status: "SHIPPED",
      totalPrice: { amount: 50, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/cannot be updated/i);
  });

  it("returns 400 when shippingAddress validation fails", async () => {
    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 50, currency: "INR" } },
      ],
      status: "PENDING",
      totalPrice: { amount: 50, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { city: "OnlyCity" } });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 401 when no token is provided", async () => {
    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 50, currency: "INR" } },
      ],
      status: "PENDING",
      totalPrice: { amount: 50, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when role is not allowed (middleware)", async () => {
    const sellerToken = jwt.sign({ _id: new mongoose.Types.ObjectId(), role: "seller" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 50, currency: "INR" } },
      ],
      status: "PENDING",
      totalPrice: { amount: 50, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when DB lookup fails", async () => {
    jest.spyOn(orderModel, "findById").mockRejectedValueOnce(new Error("DB fail"));

    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/orders/${id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(500);
  });

  it("returns 500 when saving the order fails", async () => {
    const created = await orderModel.create({
      user: userId,
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: "INR" } },
      ],
      status: "PENDING",
      timeline: [{ type: "PENDING", at: new Date() }],
      totalPrice: { amount: 100, currency: "INR" },
      shippingAddress: { street: "x", city: "c", state: "s", pincode: "560000", country: "y" },
    });

    // return a doc with a failing save()
    jest.spyOn(orderModel, "findById").mockResolvedValueOnce({
      ...created.toObject(),
      save: jest.fn().mockRejectedValueOnce(new Error("save fail")),
      user: created.user,
      status: created.status,
    });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { street: "new", city: "c", state: "s", pincode: "560000", country: "y" } });

    expect(res.statusCode).toBe(500);
  });
});
