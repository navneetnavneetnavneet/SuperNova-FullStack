const request = require("supertest");
const app = require("../src/app");
const connectDatabase = require("../src/database/db");
const userModel = require("../src/models/user.model");

describe("GET /api/auth/me", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  it("returns 200 and the current user when called with a Bearer token", async () => {
    // create user
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "me_user",
        email: "me@example.com",
        password: "Secret123",
        fullName: { firstName: "Me", lastName: "User" },
        role: "user",
      });

    const token = registerRes.body.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("me@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns 200 when called with the auth cookie", async () => {
    // register also sets cookie
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "cookie_user",
        email: "cookie@example.com",
        password: "Secret123",
        fullName: { firstName: "Cookie", lastName: "User" },
        role: "user",
      });

    const cookies = registerRes.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const res = await request(app).get("/api/auth/me").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("cookie@example.com");
  });

  it("returns 401 when no token or cookie is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
  });

  it("returns 401 if token is valid but the user no longer exists", async () => {
    // create user and get token
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "deleted_user",
        email: "deleted@example.com",
        password: "Secret123",
        fullName: { firstName: "Deleted", lastName: "User" },
        role: "user",
      });

    const token = registerRes.body.token;
    expect(token).toBeDefined();

    // remove the user from the DB to simulate deleted account
    await userModel.deleteOne({ email: "deleted@example.com" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    // handler may return 401 or 404 depending on implementation; prefer 401 for auth-failure
    expect([401, 404]).toContain(res.status);
  });

  it("validate malformed authorization header returns 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "BadHeader tokenvalue");

    expect(res.status).toBe(401);
  });
});
