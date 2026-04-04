const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const productModel = require("../src/models/product.model");
const app = require("../src/app");
const { generateToken } = require("./helpers/token");

describe("DELETE /api/products/:id", () => {
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

  it("should delete product when requested by owner (happy path)", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ _id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const [created] = await productModel.insertMany([
      { title: "ToDelete", price: { amount: 1, currency: "INR" }, seller: sellerId },
    ]);

    const res = await request(app)
      .delete(`/api/products/${created._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const found = await productModel.findById(created._id);
    expect(found).toBeNull();
  });

  it("should return 401 without token", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/products/${id}`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const token = generateToken("user");
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 400 for invalid id format", async () => {
    const token = generateToken("seller");

    const res = await request(app)
      .delete(`/api/products/invalid-id`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 when product not found", async () => {
    const token = generateToken("seller");
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it("should return 403 when deleting someone else's product", async () => {
    const owner = new mongoose.Types.ObjectId();
    const other = new mongoose.Types.ObjectId();
    const tokenOther = jwt.sign({ _id: other, role: "seller" }, process.env.JWT_SECRET);

    const [created] = await productModel.insertMany([
      { title: "Owned", price: { amount: 5, currency: "INR" }, seller: owner },
    ]);

    const res = await request(app)
      .delete(`/api/products/${created._id}`)
      .set("Authorization", `Bearer ${tokenOther}`);

    expect(res.statusCode).toBe(403);
    expect((await productModel.findById(created._id))).not.toBeNull();
  });

  it("should return 500 if DB fails", async () => {
    jest.spyOn(productModel, "findOne").mockRejectedValueOnce(new Error("DB error"));

    const token = generateToken("seller");
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
