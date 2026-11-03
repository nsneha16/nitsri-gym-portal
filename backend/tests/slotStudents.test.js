require("dotenv").config()
const db = require("../src/config/db")
const { tools } = require("../src/agent/tools")

const tool = tools.find(t => t.name === "slot_students")
const CODE = "ZT9"
const mail = n => `slotstu.${n}@demo.invalid`
let sid
const uids = []

const addUser = async (n, name) => {
  await db.query(
    `INSERT INTO users (name,email,password,role,department,year,batch,profile_complete)
     VALUES (?,?,'x','student','CSE',2,'2025',1)`, [name, mail(n)])
  const [[u]] = await db.query("SELECT id FROM users WHERE email = ?", [mail(n)])
  uids.push(u.id)
  return u.id
}
const addEnr = (u, status, dateSql) =>
  db.query(
    `INSERT INTO enrollments (user_id,slot_id,status,enrolled_date) VALUES (?,?,?,${dateSql})`,
    [u, sid, status])

beforeAll(async () => {
  await db.query("DELETE FROM users WHERE email LIKE 'slotstu.%@demo.invalid'")
  const [s] = await db.query(
    `INSERT INTO slots (name,start_time,end_time,days,capacity,enrolled_count,is_active,slot_code)
     VALUES ('T Slot Students','03:00:00','03:40:00','Mon',10,2,1,?)`, [CODE])
  sid = s.insertId

  const a = await addUser(1, "Late Expiry")
  const b = await addUser(2, "Early Expiry")
  const c = await addUser(3, "Cancelled One")
  const d = await addUser(4, "Past Expiry")

  await addEnr(a, "confirmed", "CURDATE()")
  await addEnr(b, "confirmed", "DATE_SUB(CURDATE(), INTERVAL 10 DAY)")
  await addEnr(c, "cancelled", "CURDATE()")
  await addEnr(d, "confirmed", "DATE_SUB(CURDATE(), INTERVAL 3 MONTH)")
})

afterAll(async () => {
  await db.query("DELETE FROM enrollments WHERE slot_id = ?", [sid])
  await db.query("DELETE FROM slots WHERE id = ?", [sid])
  await db.query("DELETE FROM users WHERE email LIKE 'slotstu.%@demo.invalid'")
  await db.end()
})

describe("slot_students: validate", () => {
  it("lowercase code is trimmed and upper-cased", () => {
    expect(tool.validate({ slot_code: " es4 " })).toEqual({ value: { slot_code: "ES4" } })
  })
  it.each([[{}], [undefined], [{ slot_code: "" }], [{ slot_code: 5 }],
          [{ slot_code: "ES4; DROP TABLE slots" }], [{ slot_code: "x".repeat(11) }]])(
    "bad args %j -> error", args => {
      expect(tool.validate(args).error).toBeTruthy()
    })
})

describe("slot_students: run (real DB)", () => {
  it("returns only active, non-expired students, soonest expiry first", async () => {
    const r = await tool.run({ slot_code: CODE })
    expect(r.slot_code).toBe(CODE)
    expect(r.count).toBe(2)
    expect(r.students.map(s => s.name)).toEqual(["Early Expiry", "Late Expiry"])
    expect(r.students[0].days_left).toBeLessThan(r.students[1].days_left)
  })
  it("does not leak email in the result", async () => {
    const r = await tool.run({ slot_code: CODE })
    expect(JSON.stringify(r)).not.toMatch(/@demo\.invalid/)
  })
  it("unknown slot code throws a readable error", async () => {
    await expect(tool.run({ slot_code: "NOPE1" })).rejects.toThrow(/No slot with code/)
  })
})