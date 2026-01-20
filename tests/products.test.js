
const request = require("supertest");
const app = require("../app");

describe("Products API", () => {
  it("GET /api/products returns array", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("Protected route should require auth", async () => {
    const res = await request(app).post("/api/products").send({ name: "Test" });
    expect(res.status).toBe(401); // assuming it requires auth
  });
});
