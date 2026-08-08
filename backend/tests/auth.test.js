require('dotenv').config()
const request = require("supertest")
const app = require("../src/app")
const db = require("../src/config/db")

describe("Auth API", () => {
  afterAll(async () => {
    await db.end()  // connection pool band karo, warna Jest hang hoga
  })

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "gymadmin@nitsri.ac.in", password: "wrongpassword" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("should reject login for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@nitsri.ac.in", password: "anything" })

    expect(res.statusCode).toBe(404)
  })

  it("should reject signup with non-college email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Test User", email: "test@gmail.com", password: "test123" })

    expect(res.statusCode).toBe(400)
  })

  it("should reject signup with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "incomplete@nitsri.ac.in" })

    expect(res.statusCode).toBe(400)
  })
  it("should safely handle SQL injection attempt in email field", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "' OR '1'='1", password: "anything" })

    // Ye 404 ya 401 aana chahiye — 200 (successful login) BILKUL nahi aana chahiye
    expect(res.statusCode).not.toBe(200)
    expect(res.statusCode).toBe(404)  // kyunki email format se koi user match nahi hoga
  })
})