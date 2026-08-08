require('dotenv').config()
const request = require("supertest")
const app = require("../src/app")
const db = require("../src/config/db")

describe("Concurrent Slot Booking", () => {
  let testSlotId
  let studentToken1
  let studentToken2

  beforeAll(async () => {
    // Test slot banao — capacity 1, taaki race condition trigger ho
    const [result] = await db.query(
      `INSERT INTO slots (name, start_time, end_time, days, capacity, enrolled_count, is_active)
       VALUES ('Test Concurrency Slot', '06:00:00', '07:00:00', 'Mon,Tue,Wed', 1, 0, 1)`
    )
    testSlotId = result.insertId

    // Do test students banao (agar pehle se na hon)
    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Test Student One', 'teststudent1@nitsri.ac.in', '$2b$10$dummyhashfortest', 'student')
       ON DUPLICATE KEY UPDATE name = name`
    )
    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Test Student Two', 'teststudent2@nitsri.ac.in', '$2b$10$dummyhashfortest', 'student')
       ON DUPLICATE KEY UPDATE name = name`
    )

    const [users] = await db.query(
      `SELECT id FROM users WHERE email IN ('teststudent1@nitsri.ac.in', 'teststudent2@nitsri.ac.in')`
    )

    const generateToken = require("../src/utils/generateToken")
    studentToken1 = generateToken({ id: users[0].id, role: 'student' })
    studentToken2 = generateToken({ id: users[1].id, role: 'student' })
  })

  afterAll(async () => {
    // Cleanup — test data hatao
    await db.query("DELETE FROM enrollments WHERE slot_id = ?", [testSlotId])
    await db.query("DELETE FROM slots WHERE id = ?", [testSlotId])
    await db.query(
      "DELETE FROM users WHERE email IN ('teststudent1@nitsri.ac.in', 'teststudent2@nitsri.ac.in')"
    )
    await db.end()
  })

  it("should allow only ONE student to enroll when two request simultaneously for a 1-capacity slot", async () => {
    // Dono requests EK SAATH bhejo — Promise.all se
    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${studentToken1}`)
        .send({ slot_id: testSlotId }),
      request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${studentToken2}`)
        .send({ slot_id: testSlotId }),
    ])

    const statusCodes = [res1.statusCode, res2.statusCode].sort()

    // Ek 201 (success) aur ek 409 (slot full) hona chahiye — dono 201 nahi
    expect(statusCodes).toEqual([201, 409])

    // Database mein confirm karo sirf EK enrollment bani
    const [enrollments] = await db.query(
      "SELECT * FROM enrollments WHERE slot_id = ? AND status = 'confirmed'",
      [testSlotId]
    )
    expect(enrollments.length).toBe(1)

    // Slot ka enrolled_count bhi sirf 1 hona chahiye, 2 nahi (overbooking check)
    const [[slot]] = await db.query(
      "SELECT enrolled_count FROM slots WHERE id = ?", [testSlotId]
    )
    expect(slot.enrolled_count).toBe(1)
  })
})