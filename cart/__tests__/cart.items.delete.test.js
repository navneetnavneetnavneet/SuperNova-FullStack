const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const cartModel = require("../src/models/cart.model");

describe("DELETE /api/cart/items/:productId", () => {
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

  it("should delete an existing item from the cart", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    await cartModel.create({
      user: userId,
      items: [{ productId, quantity: 3 }],
    });

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Item removed from cart successfully");
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items).toHaveLength(0);
  });

  it("should return 400 for invalid productId", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);

    const res = await request(app)
      .delete(`/api/cart/items/invalid-id`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid product id");
  });

  it("should return 401 when no token is provided", async () => {
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app).delete(`/api/cart/items/${productId}`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "seller" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 404 when the cart does not exist", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });

  it("should return 404 when the item is not in the cart", async () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();
    const otherProductId = new mongoose.Types.ObjectId();

    await cartModel.create({
      user: userId,
      items: [{ productId: otherProductId, quantity: 1 }],
    });

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Item not found in cart");
  });

  it("should return 500 if the database query fails", async () => {
    jest.spyOn(cartModel, "findOne").mockRejectedValueOnce(new Error("DB error"));

    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: userId, role: "user" }, process.env.JWT_SECRET);
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
