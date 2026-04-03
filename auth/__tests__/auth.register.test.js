const request = require("supertest");
const app = require("../src/app");
const connectDatabase = require("../src/database/db");

describe("POST /api/auth/register", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  it("create a user return 201 with user (no password)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "jhon_doe",
        email: "jhon@example.com",
        password: "Secret123",
        fullName: { firstName: "Jhon", lastName: "Doe" },
        role: "user"
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("jhon_doe");
    expect(res.body.user.email).toBe("jhon@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("duplicate email or username return 409", async () => {
    // create first
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "dupuser",
        email: "dup@example.com",
        password: "Secret123",
        fullName: { firstName: "Duplicate", lastName: "User" },
        role: "user"
      });

    // duplicate
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "dupuser",
        email: "dup@example.com",
        password: "Secret123",
        fullName: { firstName: "Duplicate", lastName: "User" },
        role: "user"
      });

    expect(res.status).toBe(409);
  });

  it("validate missing fields return 400", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
  });
});
