const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

describe("Authenticated Reviews API", () => {
  let token;
  let productId;
  let reviewId;

  beforeAll(async () => {
    // 1) Create a product to attach reviews to
    const productRes = await request(app)
      .post("/api/products")
      .send({
        name: "Secure Test Bow",
        price: 12.99,
        category: "sparkle",
        description: "A bow for auth testing!",
        images: ["http://example.com/bow2.png"],
        inventory: 3,
      });

    productId = productRes.body._id;

    // 2) Sign up a new user (optional — you can also log in an existing user)
    await request(app)
      .post("/api/auth/signup")
      .send({
        email: "authreview@test.com",
        password: "password123",
        name: "Auth Reviewer",
      });

    // 3) Log in to get an access token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "authreview@test.com",
        password: "password123",
      });

    token = loginRes.body.accessToken;
  });

  it("Should reject creating a review without auth", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        productId,
        userName: "NotLoggedInUser",
        rating: 3,
        text: "Should not work!",
      });
    expect(res.status).toBe(401);
  });

  it("Should allow creating a review when authenticated", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`) // attach valid token
      .send({
        productId,
        userName: "AuthTester",
        rating: 5,
        text: "This bow is excellent!",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    reviewId = res.body._id;
  });

  it("Should fetch reviews for product", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("Should update a review when authenticated", async () => {
    const res = await request(app)
      .patch(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 4, text: "Still great, slight update." });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
  });

  it("Should not update review without auth", async () => {
    const res = await request(app)
      .patch(`/api/reviews/${reviewId}`)
      .send({ rating: 1 });

    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

