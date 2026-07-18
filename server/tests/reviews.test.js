const request = require("supertest");
const app = require("../app");
const Product = require("../models/productModel");

describe("Reviews API", () => {
  let productId;
  let createdReviewId;

  beforeEach(async () => {
    const product = await Product.create({
      name: `Test Bow ${Date.now()}`,
      price: 10.99,
      category: "sparkle",
      description: "Test description",
      images: [{ url: "http://example.com/bow.png", alt: "Test bow" }],
      inventory: 5,
    });

    productId = product._id.toString();
  });

  it("POST /api/reviews creates a new review", async () => {
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

  it("GET /api/reviews/:productId fetches reviews for a product", async () => {
    await request(app)
      .post("/api/reviews")
      .send({
        productId,
        userName: "Tester",
        rating: 5,
        text: "Amazing bow!",
      });

    const res = await request(app).get(`/api/reviews/${productId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toMatchObject({
      productId,
      userName: "Tester",
    });
  });

  it("PATCH /api/reviews/:reviewId updates a review", async () => {
    const createRes = await request(app)
      .post("/api/reviews")
      .send({
        productId,
        userName: "Tester",
        rating: 5,
        text: "Amazing bow!",
      });

    createdReviewId = createRes.body._id;

    const res = await request(app)
      .patch(`/api/reviews/${createdReviewId}`)
      .send({ rating: 4, text: "Still good, slightly changed opinion." });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
    expect(res.body.text).toMatch(/Still good/);
  });

  it("POST /api/reviews returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ productId });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });
});
