const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const productModel = require("../src/models/product.model");
const app = require("../src/app");
const { generateToken } = require("./helpers/token");

describe("PATCH /api/products/:id", () => {
  beforeAll(async () => {
    // ensure JWT secret exists for token generation
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should update product title (happy path)", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { _id: sellerId, role: "seller" },
      process.env.JWT_SECRET,
    );

    const [created] = await productModel.insertMany([
      {
        title: "Old title",
        price: { amount: 10, currency: "INR" },
        seller: sellerId,
      },
    ]);

    const res = await request(app)
      .patch(`/api/products/${created._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New title" });

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.title).toBe("New title");
  });

  it("should update nested price.amount", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { _id: sellerId, role: "seller" },
      process.env.JWT_SECRET,
    );

    const [created] = await productModel.insertMany([
      {
        title: "Product",
        price: { amount: 50, currency: "INR" },
        seller: sellerId,
      },
    ]);

    const res = await request(app)
      .patch(`/api/products/${created._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: { amount: 999 } });

    expect(res.statusCode).toBe(200);
    expect(res.body.product.price.amount).toBe(999);
  });

  it("should update multiple fields and ignore disallowed fields", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { _id: sellerId, role: "seller" },
      process.env.JWT_SECRET,
    );

    const [created] = await productModel.insertMany([
      {
        title: "Old",
        description: "Old desc",
        price: { amount: 10, currency: "INR" },
        seller: sellerId,
      },
    ]);

    const fakeOtherSeller = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/products/${created._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New",
        description: "New desc",
        price: { amount: 20, currency: "USD" },
        seller: fakeOtherSeller, // should be ignored
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.product.title).toBe("New");
    expect(res.body.product.description).toBe("New desc");
    expect(res.body.product.price.amount).toBe(20);
    expect(res.body.product.price.currency).toBe("USD");
    // seller must remain unchanged
    expect(res.body.product.seller).toBe(sellerId.toString());
  });

  it("should return 401 without token", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/products/${id}`)
      .send({ title: "x" });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const token = generateToken("user");
    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "x" });

    expect(res.statusCode).toBe(403);
  });

  it("should return 400 for invalid id format", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { _id: sellerId, role: "seller" },
      process.env.JWT_SECRET,
    );

    const res = await request(app)
      .patch(`/api/products/invalid-id`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "x" });

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
    jest
      .spyOn(productModel, "findOne")
      .mockRejectedValueOnce(new Error("DB error"));

    const sellerId = new mongoose.Types.ObjectId();
    const token = jwt.sign(
      { _id: sellerId, role: "seller" },
      process.env.JWT_SECRET,
    );

    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "x" });

    expect(res.statusCode).toBe(500);
  });
});
