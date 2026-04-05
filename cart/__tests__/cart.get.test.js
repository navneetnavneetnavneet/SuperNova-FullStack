const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const cartModel = require("../src/models/cart.model");

const generateToken = (role = "user") => {
  return jwt.sign(
    { _id: new mongoose.Types.ObjectId(), role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

describe("GET /api/cart", () => {
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    token = generateToken("user");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cartModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create and return an empty cart when none exists", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.totals.totalItems).toBe(0);
    expect(res.body.totals.totalQuantity).toBe(0);
  });

  it("should return existing cart with items and correct totals", async () => {
    const productA = new mongoose.Types.ObjectId();
    const productB = new mongoose.Types.ObjectId();

    // add two different items
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productA.toString(), quantity: 2 });

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productB.toString(), quantity: 3 });

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items).toHaveLength(2);
    expect(res.body.totals.totalItems).toBe(2);
    expect(res.body.totals.totalQuantity).toBe(5);
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for users with wrong role", async () => {
    const sellerToken = generateToken("seller");

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 500 when DB findOne fails", async () => {
    jest.spyOn(cartModel, "findOne").mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
