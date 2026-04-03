const request = require("supertest");
const app = require("../src/app");
const connectDatabase = require("../src/database/db");

describe("GET /api/auth/logout", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  it("clears the auth cookie and returns 200 (cookie-based session is invalid afterwards)", async () => {
    // register (sets cookie)
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "logout_user",
        email: "logout@example.com",
        password: "Secret123",
        fullName: { firstName: "Logout", lastName: "User" },
        role: "user"
      });

    const originalCookies = registerRes.headers["set-cookie"];
    expect(originalCookies).toBeDefined();

    // perform logout using the cookie
    const logoutRes = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", originalCookies);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers["set-cookie"]).toBeDefined();

    // cookie should be cleared/expired (accept common clearing formats)
    const cleared = logoutRes.headers["set-cookie"].some((c) =>
      /(^|\s)token=;|Max-Age=0|Expires=/.test(c),
    );
    expect(cleared).toBe(true);

    // using the cleared cookie to access /me must fail
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", logoutRes.headers["set-cookie"]);
    expect(meRes.status).toBe(401);
  });

  it("is idempotent: calling logout without a cookie still returns 200", async () => {
    const res = await request(app).get("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  it("accepts Authorization Bearer cookie-clear request and returns 200 with Set-Cookie", async () => {
    // register to get a bearer token
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: "logout_bearer",
        email: "logout-bearer@example.com",
        password: "Secret123",
        fullName: { firstName: "Bearer", lastName: "User" },
        role: "user"
      });

    const token = registerRes.body.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    const cleared = res.headers["set-cookie"].some((c) =>
      /(^|\s)token=;|Max-Age=0|Expires=/.test(c),
    );
    expect(cleared).toBe(true);
  });
});
