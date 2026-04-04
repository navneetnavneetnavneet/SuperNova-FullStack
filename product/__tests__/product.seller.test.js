const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const productModel = require("../src/models/product.model");
const app = require("../src/app");
const { generateToken } = require("./helpers/token");

describe("GET /api/products/seller", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return products belonging to the authenticated seller (happy path)", async () => {
    const sellerA = new mongoose.Types.ObjectId();
    const sellerB = new mongoose.Types.ObjectId();

    await productModel.insertMany([
      { title: "A1", price: { amount: 1, currency: "INR" }, seller: sellerA },
      { title: "A2", price: { amount: 2, currency: "INR" }, seller: sellerA },
      { title: "B1", price: { amount: 3, currency: "INR" }, seller: sellerB },
    ]);

    const token = jwt.sign({ _id: sellerA, role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app)
      .get(`/api/products/seller`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((p) => p.seller === sellerA.toString())).toBe(true);
  });

  it("should respect skip and limit (limit capped to 20)", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const docs = Array.from({ length: 25 }).map((_, i) => ({
      title: `P${i}`,
      price: { amount: i + 1, currency: "INR" },
      seller: sellerId,
    }));

    await productModel.insertMany(docs);

    const token = jwt.sign({ _id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const res1 = await request(app)
      .get(`/api/products/seller?skip=1&limit=1`)
      .set("Authorization", `Bearer ${token}`);

    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.length).toBe(1);

    const res2 = await request(app)
      .get(`/api/products/seller?limit=50`)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.data.length).toBe(20);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get(`/api/products/seller`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const token = generateToken("user");

    const res = await request(app)
      .get(`/api/products/seller`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 500 if DB fails", async () => {
    jest.spyOn(productModel, "find").mockReturnValueOnce({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValueOnce(new Error("DB error")),
    });

    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app)
      .get(`/api/products/seller`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
