require("dotenv").config()
const request = require("supertest")
const app = require("../src/app")
const db = require("../src/config/db")
const gt = require("../src/utils/generateToken")

const adm = gt({ id: 1, role: "admin" })
const stu = gt({ id: 2, role: "student" })
const get = (p, t) => request(app).get(p).set("Authorization", `Bearer ${t}`)

let slotId, uid, enrId, dl
const EMAIL = "insights.t@demo.invalid"

beforeAll(async () => {
  await db.query(`INSERT INTO users (name,email,password,role,department,year,batch,profile_complete)
                  VALUES ('Insights T','${EMAIL}','x','student','CSE',4,'2023',1) ON DUPLICATE KEY UPDATE name=name`)
  uid = (await db.query("SELECT id FROM users WHERE email = ?", [EMAIL]))[0][0].id
  // 100% full slot
  const [s] = await db.query(`INSERT INTO slots (name,start_time,end_time,days,capacity,enrolled_count,is_active)
                              VALUES ('T Insight Slot','02:00:00','02:40:00','Mon',10,10,1)`)
  slotId = s.insertId
  // first-timer, expires in 2 days (enrolled 1 month ago + 2 days)
  const [e] = await db.query(
    `INSERT INTO enrollments (user_id,slot_id,status,enrolled_date)
     VALUES (?,?,'confirmed', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL 2 DAY))`, [uid, slotId])
  enrId = e.insertId
    const [[d]] = await db.query(
    "SELECT DATEDIFF(expiry_date, CURDATE()) AS dl FROM enrollments WHERE id = ?", [enrId])
  dl = Number(d.dl)
})

afterAll(async () => {
  await db.query("DELETE FROM enrollments WHERE user_id = ?", [uid])
  await db.query("DELETE FROM slots WHERE id = ?", [slotId])
  await db.query("DELETE FROM users WHERE id = ?", [uid])
  await db.end()
})

describe("insights: access control", () => {
  it.each(["slots-by-fill", "expiring", "at-risk"])("%s: no token -> 401", async p => {
    expect((await request(app).get(`/api/admin/insights/${p}`)).statusCode).toBe(401)
  })
  it.each(["slots-by-fill", "expiring", "at-risk"])("%s: student -> 403", async p => {
    expect((await get(`/api/admin/insights/${p}`, stu)).statusCode).toBe(403)
  })
})

describe("insights: slots-by-fill", () => {
  it("returns the 100% full slot first", async () => {
    const r = await get("/api/admin/insights/slots-by-fill", adm)
    expect(r.statusCode).toBe(200)
    const top = r.body.data.slots[0]
    expect(Number(top.fill_pct)).toBe(100)
    expect(r.body.data.slots.find(s => s.slot_id === slotId).open_seats).toBe(0)
  })
})

describe("insights: expiring", () => {
  it("finds the enrollment expiring in 2 days with days=7, not with days=1", async () => {
    const a = await get("/api/admin/insights/expiring?days=7", adm)
    const hit = a.body.data.enrollments.find(e => e.enrollment_id === enrId)
    expect(hit).toBeTruthy()
    // expect(hit.days_left).toBe(2)
    expect(hit.days_left).toBe(dl)
    expect(dl).toBeGreaterThan(1)
    expect(dl).toBeLessThanOrEqual(7)
    const b = await get("/api/admin/insights/expiring?days=1", adm)
    expect(b.body.data.enrollments.find(e => e.enrollment_id === enrId)).toBeUndefined()
  })
  it.each(["abc", "0", "-3", "61", "1.5"])("days=%s -> 400", async d => {
    expect((await get(`/api/admin/insights/expiring?days=${d}`, adm)).statusCode).toBe(400)
  })
})

describe("insights: at-risk", () => {
  it("scores a first-timer in a crowded slot as at least medium, with reasons", async () => {
    const r = await get("/api/admin/insights/at-risk?days=7&limit=50", adm)
    expect(r.statusCode).toBe(200)
    const s = r.body.data.students.find(x => x.enrollment_id === enrId)
    expect(s.risk_score).toBeGreaterThanOrEqual(3)          // first enrollment (2) + crowded (1)
    expect(s.risk).toBe("high")
    expect(s.reasons.join(" ")).toMatch(/first enrollment/)
    expect(s.reasons.join(" ")).toMatch(/crowded/)
  })
  it("is sorted by risk_score desc and respects limit", async () => {
    const r = await get("/api/admin/insights/at-risk?days=30&limit=3", adm)
    const sc = r.body.data.students.map(x => x.risk_score)
    expect(sc.length).toBeLessThanOrEqual(3)
    expect([...sc].sort((a, b) => b - a)).toEqual(sc)
  })
  it("limit=0 -> 400", async () => {
    expect((await get("/api/admin/insights/at-risk?limit=0", adm)).statusCode).toBe(400)
  })
})
