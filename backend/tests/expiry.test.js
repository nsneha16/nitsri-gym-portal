require("dotenv").config()
const db = require("../src/config/db")
const expire = require("../src/utils/expireEnrollments")

describe("Enrollment expiry", () => {
  let uid, sid

  beforeAll(async () => {
    await db.query(`INSERT INTO users (name,email,password,role) VALUES ('Expiry T','expiryt@nitsri.ac.in','x','student') ON DUPLICATE KEY UPDATE name=name`)
    const [[u]] = await db.query("SELECT id FROM users WHERE email='expiryt@nitsri.ac.in'")
    uid = u.id
    const [r] = await db.query(`INSERT INTO slots (name,start_time,end_time,days,capacity,enrolled_count,is_active) VALUES ('T Expiry','04:00:00','05:00:00','Mon',5,1,1)`)
    sid = r.insertId
    await db.query(`INSERT INTO enrollments (user_id,slot_id,status,enrolled_date) VALUES (?,?,'confirmed','2020-01-01')`, [uid, sid])
  })

  afterAll(async () => {
    await db.query("DELETE FROM enrollments WHERE user_id = ?", [uid])
    await db.query("DELETE FROM slots WHERE id = ?", [sid])
    await db.query("DELETE FROM users WHERE id = ?", [uid])
    await db.end()
  })

  it("expired enrollment is marked expired and seat is freed", async () => {
    const n = await expire()
    expect(n).toBeGreaterThanOrEqual(1)

    const [[e]] = await db.query("SELECT status FROM enrollments WHERE user_id = ?", [uid])
    expect(e.status).toBe("expired")

    const [[s]] = await db.query("SELECT enrolled_count FROM slots WHERE id = ?", [sid])
    expect(s.enrolled_count).toBe(0)
  })

  it("running again does not double-decrement", async () => {
    await expire()
    const [[s]] = await db.query("SELECT enrolled_count FROM slots WHERE id = ?", [sid])
    expect(s.enrolled_count).toBe(0)
  })
})