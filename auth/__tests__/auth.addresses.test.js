const request = require("supertest");
const app = require("../src/app");
const connectDatabase = require("../src/database/db");

describe("User addresses endpoints", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  const registerAndGetAuth = async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        username: `addr_user_${Date.now()}`,
        email: `addr_${Date.now()}@example.com`,
        password: "Secret123",
        fullName: { firstName: "Addr", lastName: "User" },
        role: "user",
      });

    const token = registerRes.body.token;
    const cookies = registerRes.headers["set-cookie"];
    return { token, cookies };
  };

  it("GET /users/me/addresses returns empty list for new user", async () => {
    const { token } = await registerAndGetAuth();

    const res = await request(app)
      .get("/api/auth/users/me/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses.length).toBe(0);
  });

  it("POST /users/me/addresses adds an address and GET includes it", async () => {
    const { cookies } = await registerAndGetAuth();

    const newAddress = {
      street: "123 Main St",
      city: "Test City",
      state: "Test State",
      pincode: "123456",
      country: "Testland",
      isDefault: false,
    };

    const postRes = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Cookie", cookies)
      .send(newAddress);

    expect(postRes.status).toBe(201);
    expect(postRes.body.address).toBeDefined();
    expect(postRes.body.address.street).toBe(newAddress.street);

    const getRes = await request(app)
      .get("/api/auth/users/me/addresses")
      .set("Cookie", cookies);

    expect(getRes.status).toBe(200);
    expect(getRes.body.addresses.length).toBe(1);
    expect(getRes.body.addresses[0].street).toBe(newAddress.street);
  });

  it("DELETE /users/me/addresses/:addressId removes address and subsequent GET is empty", async () => {
    const { cookies } = await registerAndGetAuth();

    const newAddress = {
      street: "456 Side St",
      city: "Delete City",
      state: "Delete State",
      pincode: "654321",
      country: "DeleteLand",
      isDefault: false,
    };

    const postRes = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Cookie", cookies)
      .send(newAddress);

    expect(postRes.status).toBe(201);
    const addressId = postRes.body.user.addresses[0]._id;
    expect(addressId).toBeDefined();

    const deleteRes = await request(app)
      .delete(`/api/auth/users/me/addresses/${addressId}`)
      .set("Cookie", cookies);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.user.addresses.length).toBe(0);

    const getRes = await request(app)
      .get("/api/auth/users/me/addresses")
      .set("Cookie", cookies);

    expect(getRes.status).toBe(200);
    expect(getRes.body.addresses.length).toBe(0);
  });

  it("DELETE non-existent address returns 404", async () => {
    const { token } = await registerAndGetAuth();

    const res = await request(app)
      .delete("/api/auth/users/me/addresses/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Address not found/);
  });

  it("POST /users/me/addresses requires authentication", async () => {
    const res = await request(app).post("/api/auth/users/me/addresses").send({
      street: "a",
      city: "b",
      state: "c",
      pincode: "123456",
      country: "d",
      isDefault: false,
    });

    expect(res.status).toBe(401);
  });

  it("GET /users/me/addresses requires authentication", async () => {
    const res = await request(app).get("/api/auth/users/me/addresses");
    expect(res.status).toBe(401);
  });

  it("DELETE /users/me/addresses/:addressId requires authentication", async () => {
    const res = await request(app).delete("/api/auth/users/me/addresses/anyid");
    expect(res.status).toBe(401);
  });
});
