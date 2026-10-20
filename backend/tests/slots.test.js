require("dotenv").config()
const request = require("supertest")
const app = require("../src/app")
const db = require("../src/config/db")
const gt = require("../src/utils/generateToken")

const body = { name: "x", start_time: "06:00:00", end_time: "07:00:00", days: "Mon", capacity: 5 }

afterAll(async () => { await db.end() })

describe("Slot routes — admin only", () => {
  const st = gt({ id: 1, role: "student" })

  it("student cannot create slot", async () => {
    const r = await request(app).post("/api/slots").set("Authorization", `Bearer ${st}`).send(body)
    expect(r.statusCode).toBe(403)
  })

  it("student cannot update slot", async () => {
    const r = await request(app).patch("/api/slots/1").set("Authorization", `Bearer ${st}`).send({ capacity: 999, is_active: 1 })
    expect(r.statusCode).toBe(403)
  })

  it("no token -> 401", async () => {
    const r = await request(app).post("/api/slots").send(body)
    expect(r.statusCode).toBe(401)
  })
})

describe("Admin routes — student blocked", () => {
  it("student cannot open admin dashboard", async () => {
    const t = gt({ id: 1, role: "student" })
    const r = await request(app).get("/api/admin/dashboard").set("Authorization", `Bearer ${t}`)
    expect(r.statusCode).toBe(403)
  })
})