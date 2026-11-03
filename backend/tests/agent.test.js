require("dotenv").config()
const request = require("supertest")
const app = require("../src/app")
const db = require("../src/config/db")
const gt = require("../src/utils/generateToken")
const { runAgent } = require("../src/agent/loop")
const { tools } = require("../src/agent/tools")
const { scripted } = require("../src/agent/providers/mock")
const { setProvider } = require("../src/agent/providers")
const { __resetLimiter } = require("../src/controllers/agentController")

const adm = gt({ id: 1, role: "admin" })
const stu = gt({ id: 2, role: "student" })
const last = m => m[m.length - 1]
let slotId

beforeAll(async () => {
  await db.query("DELETE FROM slots WHERE slot_code = 'TAG1'")
  const [s] = await db.query(`INSERT INTO slots (name,start_time,end_time,days,capacity,enrolled_count,is_active,slot_code)
                              VALUES ('T Agent Slot','01:00:00','01:40:00','Mon',10,10,1,'TAG1')`)
  slotId = s.insertId
})
afterAll(async () => {
  setProvider(null)
  await db.query("DELETE FROM slots WHERE id = ?", [slotId])
  await db.end()
})

describe("agent loop (scripted LLM, real tools, real DB)", () => {
  it("calls a tool, gets REAL data back, and answers from it", async () => {
    const [[top]] = await db.query(
      "SELECT slot_code FROM slots ORDER BY ROUND(enrolled_count / capacity * 100, 1) DESC, id LIMIT 1")
    const llm = scripted([
      { toolCalls: [{ id: "c1", name: "slots_by_fill", args: {} }] },
      m => ({ text: `Fullest: ${JSON.parse(last(m).results[0].content).slots[0].slot_code}` })
    ])
    const out = await runAgent({ llm, message: "kaun sa slot sabse bhara hai?", tools })
    expect(out.status).toBe("ok")
    expect(out.answer).toBe(`Fullest: ${top.slot_code}`)
    expect(out.steps).toBe(2)
    expect(out.trace).toHaveLength(1)
    expect(out.trace[0]).toMatchObject({ tool: "slots_by_fill", ok: true })
  })

  it("unknown tool (e.g. send_reminder) -> error is fed back, nothing runs, model can recover", async () => {
    const llm = scripted([
      { toolCalls: [{ id: "c1", name: "send_reminder", args: { user_id: 5 } }] },
      m => ({ text: "cannot: " + last(m).results[0].content })
    ])
    const out = await runAgent({ llm, message: "reminder bhej do", tools })
    expect(out.trace[0].ok).toBe(false)
    expect(out.answer).toMatch(/^cannot: Unknown tool "send_reminder"/)
  })

  it("invalid args are rejected, model retries with valid args", async () => {
    const llm = scripted([
      { toolCalls: [{ id: "c1", name: "expiring_enrollments", args: { days: 999 } }] },
      { toolCalls: [{ id: "c2", name: "expiring_enrollments", args: { days: 7 } }] },
      { text: "done" }
    ])
    const out = await runAgent({ llm, message: "kaun expire ho raha hai?", tools })
    expect(out.trace[0].ok).toBe(false)
    expect(out.trace[0].result_preview).toMatch(/between 1 and 60/)
    expect(out.trace[1].ok).toBe(true)
    expect(out.answer).toBe("done")
  })

  it('accepts numeric strings ("7") that LLMs sometimes send', async () => {
    const llm = scripted([{ toolCalls: [{ id: "c1", name: "at_risk_students", args: { days: "7", limit: "3" } }] }, { text: "ok" }])
    const out = await runAgent({ llm, message: "risk?", tools })
    expect(out.trace[0].ok).toBe(true)
  })

  it("stops at maxSteps instead of looping forever", async () => {
    const llm = scripted([{ toolCalls: [{ id: "c", name: "slots_by_fill", args: {} }] }])   // repeats forever
    const out = await runAgent({ llm, message: "loop", tools, maxSteps: 3 })
    expect(out.status).toBe("max_steps")
    expect(out.trace).toHaveLength(3)
  })

  it("a throwing tool is contained and reported to the model", async () => {
    const boom = { name: "boom", description: "x", schema: { type: "object" }, validate: a => ({ value: a }), run: async () => { throw new Error("db down") } }
    const llm = scripted([{ toolCalls: [{ id: "c1", name: "boom", args: {} }] }, m => ({ text: last(m).results[0].content })])
    const out = await runAgent({ llm, message: "x", tools: [boom] })
    expect(out.trace[0].ok).toBe(false)
    expect(out.answer).toBe("Tool failed: db down")
  })

  it("a hanging tool times out", async () => {
    const hang = { name: "hang", description: "x", schema: { type: "object" }, validate: a => ({ value: a }), run: () => new Promise(() => {}) }
    const llm = scripted([{ toolCalls: [{ id: "c1", name: "hang", args: {} }] }, m => ({ text: last(m).results[0].content })])
    const out = await runAgent({ llm, message: "x", tools: [hang], toolTimeoutMs: 50 })
    expect(out.answer).toMatch(/timed out after 50ms/)
  })

  it("agent tools are read-only (no tool can write or message anyone)", () => {
    expect(tools.map(t => t.name).sort()).toEqual(["at_risk_students", "expiring_enrollments", "slots_by_fill"])
  })
})

describe("POST /api/admin/agent/chat", () => {
  const post = (body, t = adm) => request(app).post("/api/admin/agent/chat").set("Authorization", `Bearer ${t}`).send(body)
  beforeEach(() => __resetLimiter())

  it("no token -> 401, student -> 403", async () => {
    expect((await request(app).post("/api/admin/agent/chat").send({ message: "hi" })).statusCode).toBe(401)
    expect((await post({ message: "hi" }, stu)).statusCode).toBe(403)
  })

  it.each([[{}], [{ message: "" }], [{ message: "   " }], [{ message: 42 }], [{ message: "x".repeat(1001) }]])(
    "bad message %j -> 400", async body => {
      expect((await post(body)).statusCode).toBe(400)
    })

  it("no LLM configured -> 503 (not a crash)", async () => {
    delete process.env.LLM_PROVIDER
    setProvider(null)
    expect((await post({ message: "hi" })).statusCode).toBe(503)
  })

  it("admin gets answer + trace", async () => {
    setProvider(scripted([{ toolCalls: [{ id: "c1", name: "slots_by_fill", args: {} }] }, { text: "9 slots dekhe" }]))
    const r = await post({ message: "slots?" })
    expect(r.statusCode).toBe(200)
    expect(r.body.data.answer).toBe("9 slots dekhe")
    expect(r.body.data.trace[0].tool).toBe("slots_by_fill")
  })

  it("rate limit: 16th request in a minute -> 429", async () => {
    setProvider(scripted([{ text: "ok" }]))
    const t = gt({ id: 99, role: "admin" })
    const codes = []
    for (let i = 0; i < 16; i++) codes.push((await post({ message: "hi" }, t)).statusCode)
    expect(codes.slice(0, 15).every(c => c === 200)).toBe(true)
    expect(codes[15]).toBe(429)
  })
})
