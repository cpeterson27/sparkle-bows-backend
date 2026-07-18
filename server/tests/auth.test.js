const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

function validSignupPayload(overrides = {}) {
  return {
    name: "Auth Reviewer",
    email: "authreview@test.com",
    password: "password123",
    website: "",
    formStartedAt: Date.now() - 2000,
    ...overrides,
  };
}

describe("Auth API", () => {
  it("registers a user when form protection fields are valid", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validSignupPayload());

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toMatchObject({
      email: "authreview@test.com",
      name: "Auth Reviewer",
      role: "user",
    });

    const savedUser = await User.findOne({ email: "authreview@test.com" });
    expect(savedUser).not.toBeNull();
  });

  it("blocks signup when the anti-bot timer is too fast", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(
        validSignupPayload({
          email: "too-fast@test.com",
          formStartedAt: Date.now(),
        }),
      );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/please wait a moment/i);
  });

  it("logs in and returns the current user from /me", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send(
        validSignupPayload({
          email: "login-flow@test.com",
          name: "Login Flow",
        }),
      );

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login-flow@test.com",
        password: "password123",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty("accessToken");

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({
      email: "login-flow@test.com",
      name: "Login Flow",
      role: "user",
    });
  });

  it("updates the authenticated user's profile", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send(
        validSignupPayload({
          email: "profile-update@test.com",
          name: "Before Update",
        }),
      );

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile-update@test.com",
        password: "password123",
      });

    const res = await request(app)
      .patch("/api/auth/update-profile")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
      .send({
        name: "After Update",
        phone: "555-0101",
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "profile-update@test.com",
      name: "After Update",
      phone: "555-0101",
    });
    expect(res.body).toHaveProperty("token");
  });
});
