const request = require("supertest");
const mongoose = require("mongoose");
const productModel = require("../src/models/product.model");
const app = require("../src/app");

describe("GET /api/products", () => {
  beforeAll(async () => {
    // ensure JWT secret exists for any auth utilities (setup.js also sets it)
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 200 and an empty array when no products", async () => {
    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it("should return products (basic retrieval)", async () => {
    const docs = [
      {
        title: "One",
        price: { amount: 10, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
      {
        title: "Two",
        price: { amount: 20, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
    ];

    await productModel.insertMany(docs);

    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("should filter by text query (q)", async () => {
    await productModel.insertMany([
      {
        title: "Blue widget",
        price: { amount: 10, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
      {
        title: "Red gadget",
        price: { amount: 20, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
    ]);

    const res = await request(app).get("/api/products?q=Blue");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toMatch(/Blue/i);
  });

  it("should filter by minPrice and maxPrice", async () => {
    await productModel.insertMany([
      {
        title: "Cheap",
        price: { amount: 5, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
      {
        title: "Mid",
        price: { amount: 50, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
      {
        title: "Expensive",
        price: { amount: 500, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
      },
    ]);

    const res = await request(app).get(
      "/api/products?minPrice=10&maxPrice=100",
    );

    expect(res.statusCode).toBe(200);
    expect(
      res.body.data.every((p) => p.price.amount >= 10 && p.price.amount <= 100),
    ).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it("should respect skip and limit (and cap limit to 20)", async () => {
    const docs = Array.from({ length: 25 }).map((_, i) => ({
      title: `P${i}`,
      price: { amount: i + 1, currency: "INR" },
      seller: new mongoose.Types.ObjectId(),
    }));

    await productModel.insertMany(docs);

    const res1 = await request(app).get("/api/products?skip=1&limit=1");
    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.length).toBe(1);

    const res2 = await request(app).get("/api/products?limit=50");
    expect(res2.statusCode).toBe(200);
    // controller caps limit to 20
    expect(res2.body.data.length).toBe(20);
  });

  it("should return 500 if DB fails", async () => {
    jest.spyOn(productModel, "find").mockReturnValueOnce({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValueOnce(new Error("DB error")),
    });

    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(500);
  });
});
