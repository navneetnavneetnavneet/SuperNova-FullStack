const request = require("supertest");
const mongoose = require("mongoose");
const productModel = require("../src/models/product.model");
const app = require("../src/app");
const { generateToken } = require("./helpers/token");

// ✅ ALWAYS mock external services
jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

const { uploadImage } = require("../src/services/imagekit.service");

describe("POST /api/products", () => {
  let token;

  beforeAll(async () => {
    // safer JWT
    process.env.JWT_SECRET = "testsecret";

    token = generateToken("seller");
  });

  // ✅ VERY IMPORTANT — clean DB
  afterEach(async () => {
    jest.clearAllMocks();
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ⭐ HAPPY PATH
  it("should create product without images", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Product",
        priceAmount: 100,
        priceCurrency: "INR",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toBeDefined();
  });

  it("should create product with images", async () => {
    uploadImage.mockResolvedValue({
      url: "fake-url",
      thumbnail: "fake-thumb",
      id: "file1",
    });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Product")
      .field("priceAmount", "100")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("fake"), "image.jpg");

    expect(res.statusCode).toBe(201);
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });

  // ⭐ AUTH
  it("should return 401 without token", async () => {
    const res = await request(app).post("/api/products");

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for wrong role", async () => {
    const userToken = generateToken("user");

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  // ⭐ VALIDATION
  it("should fail when title missing", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        priceAmount: 100,
        priceCurrency: "INR",
      });

    expect(res.statusCode).toBe(400);
  });

  // ⭐ FAILURE CASES
  it("should return 500 if image upload fails", async () => {
    uploadImage.mockRejectedValue(new Error("upload failed"));

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Product")
      .field("priceAmount", "100")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("fake"), "image.jpg");

    expect(res.statusCode).toBe(500);
  });

  it("should return 500 if DB fails", async () => {
    jest
      .spyOn(productModel, "create")
      .mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test",
        priceAmount: 100,
        priceCurrency: "INR",
      });

    expect(res.statusCode).toBe(500);
  });
});
