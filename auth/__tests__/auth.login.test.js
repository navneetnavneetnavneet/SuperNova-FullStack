const request = require("supertest");
const app = require("../src/app");
const connectDatabase = require("../src/database/db");

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  it("successful login returns 200, user (no password) and token + cookie", async () => {
    // create user first
    await request(app).post("/api/auth/register").send({
      username: "login_user",
      email: "login@example.com",
      password: "Secret123",
      fullName: { firstName: "Login", lastName: "User" },
      role: "user"
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "Secret123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("login@example.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("wrong password returns 401", async () => {
    // create user
    await request(app).post("/api/auth/register").send({
      username: "wp_user",
      email: "wp@example.com",
      password: "Secret123",
      fullName: { firstName: "WP", lastName: "User" },
      role: "user"
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "wp@example.com",
      password: "WrongPass",
    });

    expect(res.status).toBe(401);
  });

  it("non-existent user returns 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "noone@example.com",
      password: "Whatever123",
    });

    expect(res.status).toBe(401);
  });

  it("missing fields return 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
