const request = require("supertest");
const mongoose = require("mongoose");
const productModel = require("../src/models/product.model");
const app = require("../src/app");

describe("GET /api/products/:id", () => {
  beforeAll(async () => {
    // ensure JWT secret exists (keeps parity with other tests)
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ⭐ HAPPY PATH
  it("should return 200 and the product when product exists", async () => {
    const doc = {
      title: "Existing product",
      price: { amount: 123, currency: "INR" },
      seller: new mongoose.Types.ObjectId(),
    };

    const [created] = await productModel.insertMany([doc]);

    const res = await request(app).get(`/api/products/${created._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product._id).toBe(created._id.toString());
    expect(res.body.product.title).toBe(doc.title);
  });

  // ⭐ NOT FOUND
  it("should return 404 when product not found", async () => {
    const id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/products/${id}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  // ⭐ INVALID INPUT / CAST ERROR -> controller currently returns 500
  it("should return 400 for invalid id format", async () => {
    const res = await request(app).get(`/api/products/invalid-id`);

    expect(res.statusCode).toBe(400);
  });

  // ⭐ FAILURE CASES
  it("should return 500 if DB fails", async () => {
    jest
      .spyOn(productModel, "findById")
      .mockRejectedValueOnce(new Error("DB error"));

    const id = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${id}`);

    expect(res.statusCode).toBe(500);
  });
});
