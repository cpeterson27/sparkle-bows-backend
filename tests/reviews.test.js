const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

// A sample product with ID to attach reviews to
let productId;

// Before all tests, optionally create a product first
beforeAll(async () => {
  // Create a product to attach reviews to
  const productRes = await request(app)
    .post("/api/products")
    .send({
      name: "Test Bow",
      price: 10.99,
      category: "sparkle",
      description: "Test description",
      images: ["http://example.com/bow.png"],
      inventory: 5,
    });

  // Store the productId for later use
  productId = productRes.body._id;
});

describe("Reviews API", () => {
  let createdReviewId;

  it("POST /api/reviews — should create a new review", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        productId,
        userName: "Tester",
        rating: 5,
        text: "Amazing bow!",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.rating).toBe(5);
    createdReviewId = res.body._id;
  });

  it("GET /api/reviews/:productId — should fetch reviews for product", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("PATCH /api/reviews/:reviewId — should update a review", async () => {
    const res = await request(app)
      .patch(`/api/reviews/${createdReviewId}`)
      .send({ rating: 4, text: "Still good, slightly changed opinion." });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.text).toMatch(/Still good/);
  });

  it("POST /api/reviews — missing fields should return 400", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ productId }); // missing other fields

    expect(res.status).toBe(400);
  });
});

// Close DB connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});
