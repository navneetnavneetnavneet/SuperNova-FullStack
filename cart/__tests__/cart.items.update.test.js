const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const cartModel = require("../src/models/cart.model");

describe("PATCH /api/cart/items/:productId", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cartModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should update quantity for an existing item (happy path)", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    await cartModel.create({
      user: userId,
      items: [{ productId, quantity: 2 }],
    });

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(5);
  });

  it("should return 400 for invalid productId param", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);

    const res = await request(app)
      .patch(`/api/cart/items/invalid-id`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 400 for invalid quantity", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 401 when no token is provided", async () => {
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .send({ quantity: 1 });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "seller" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(res.statusCode).toBe(403);
  });

  it("should return 404 when cart or item not found", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    // no cart created for this user
    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.statusCode).toBe(404);
  });

  it("should return 500 if DB fails", async () => {
    jest.spyOn(cartModel, "findOne").mockRejectedValueOnce(new Error("DB error"));

    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.statusCode).toBe(500);
  });
});
