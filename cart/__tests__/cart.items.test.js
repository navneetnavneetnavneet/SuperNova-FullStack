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

describe("POST /api/cart/items", () => {
  let token;

  beforeAll(() => {
    // ensure test JWT secret is set by tests/setup.js but be explicit here
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

  it("should add an item to an empty cart (happy path)", async () => {
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Item added to cart successfully");
    expect(res.body.cart).toBeDefined();
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(2);
    expect(res.body.cart.items[0].productId).toBe(productId.toString());
  });

  it("should increment quantity when the same product is added twice", async () => {
    const productId = new mongoose.Types.ObjectId();

    // first add
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 2 });

    // add again
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(5);
  });

  it("should return 400 when productId is invalid", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: "not-a-mongo-id", quantity: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 400 when quantity is not a positive integer", async () => {
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 401 when no token is provided", async () => {
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId: productId.toString(), quantity: 1 });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for users with wrong role", async () => {
    const sellerToken = generateToken("seller");
    const productId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ productId: productId.toString(), quantity: 1 });

    expect(res.statusCode).toBe(403);
  });

  it("should return 500 when DB save fails", async () => {
    const productId = new mongoose.Types.ObjectId();

    // cause save() to throw
    jest.spyOn(cartModel.prototype, "save").mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId.toString(), quantity: 1 });

    expect(res.statusCode).toBe(500);
  });
});
