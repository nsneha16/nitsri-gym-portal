// Offline tests for the real-LLM adapters: fetch is mocked, no network, no API key needed.
const anthropic = require("../src/agent/providers/anthropic")
const gemini = require("../src/agent/providers/gemini")

const TOOLS = [{
  name: "expiring_enrollments", description: "d",
  schema: { type: "object", properties: { days: { type: "integer" }, flag: { type: "boolean" } } }
}]
const okJson = body => ({ ok: true, status: 200, json: async () => body })
let spy
beforeEach(() => { spy = jest.spyOn(global, "fetch") })
afterEach(() => { spy.mockRestore(); delete process.env.ANTHROPIC_API_KEY; delete process.env.GEMINI_API_KEY })

describe("anthropic adapter", () => {
  beforeEach(() => { process.env.ANTHROPIC_API_KEY = "sk-test-SECRET" })

  it("builds the request and parses text + tool_use", async () => {
    const blocks = [{ type: "text", text: "checking" }, { type: "tool_use", id: "tu_1", name: "expiring_enrollments", input: { days: 7 } }]
    spy.mockResolvedValue(okJson({ content: blocks }))
    const llm = anthropic()
    const msgs = [
      { role: "user", content: "who expires?" },
      { role: "assistant", text: "", toolCalls: [], raw: [{ type: "tool_use", id: "tu_0", name: "expiring_enrollments", input: {} }] },
      { role: "tool", results: [{ id: "tu_0", name: "expiring_enrollments", content: '{"count":0}', isError: false }] }
    ]
    const out = await llm.chat({ system: "SYS", messages: msgs, tools: TOOLS })
    const [url, init] = spy.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(url).toBe("https://api.anthropic.com/v1/messages")
    expect(init.headers["x-api-key"]).toBe("sk-test-SECRET")
    expect(init.headers["anthropic-version"]).toBe("2023-06-01")
    expect(body.system).toBe("SYS")
    expect(body.tools[0]).toEqual({ name: "expiring_enrollments", description: "d", input_schema: TOOLS[0].schema })
    expect(body.messages[1]).toEqual({ role: "assistant", content: msgs[1].raw })            // replayed as-is
    expect(body.messages[2]).toEqual({ role: "user", content: [{ type: "tool_result", tool_use_id: "tu_0", content: '{"count":0}', is_error: false }] })
    expect(out.text).toBe("checking")
    expect(out.toolCalls).toEqual([{ id: "tu_1", name: "expiring_enrollments", args: { days: 7 } }])
    expect(out.raw).toBe(blocks)
  })

  it("HTTP error -> AppError 502 with the API message, never the key", async () => {
    spy.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { message: "invalid x-api-key" } }) })
    await expect(anthropic().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS }))
      .rejects.toMatchObject({ statusCode: 502, message: "LLM error 401: invalid x-api-key" })
  })

  it("missing key -> 503", () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => anthropic()).toThrow(/ANTHROPIC_API_KEY/)
  })
})

describe("gemini adapter", () => {
  beforeEach(() => { process.env.GEMINI_API_KEY = "g-test-SECRET"; process.env.GEMINI_MODEL = "gemini-test" })

  it("upper-cases schema types, replays model content (thought signature) and wraps tool results", async () => {
    const content = { role: "model", parts: [{ functionCall: { name: "expiring_enrollments", args: { days: 7 } }, thoughtSignature: "SIG123" }] }
    spy.mockResolvedValue(okJson({ candidates: [{ content }] }))
    const llm = gemini()
    const modelPrev = { role: "model", parts: [{ functionCall: { name: "expiring_enrollments", args: {} }, thoughtSignature: "OLDSIG" }] }
    const msgs = [
      { role: "user", content: "who expires?" },
      { role: "assistant", text: "", toolCalls: [], raw: modelPrev },
      { role: "tool", results: [
        { id: "a", name: "expiring_enrollments", content: '{"count":2}', isError: false },
        { id: "b", name: "expiring_enrollments", content: '{"rows":[1,2]...[truncated 99 chars]', isError: false },   // ends with "]" - must not crash
        { id: "c", name: "expiring_enrollments", content: "Invalid arguments: days", isError: true }
      ] }
    ]
    const out = await llm.chat({ system: "SYS", messages: msgs, tools: TOOLS })
    const [url, init] = spy.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent")
    expect(init.headers["x-goog-api-key"]).toBe("g-test-SECRET")
    expect(url).not.toMatch(/SECRET/)                                              // key only in header, never in URL
    expect(body.systemInstruction.parts[0].text).toBe("SYS")
    const params = body.tools[0].functionDeclarations[0].parameters
    expect(params.type).toBe("OBJECT")
    expect(params.properties.days.type).toBe("INTEGER")
    expect(params.properties.flag.type).toBe("BOOLEAN")
    expect(body.contents[1]).toEqual(modelPrev)                                    // signature preserved
    const fr = body.contents[2].parts.map(p => p.functionResponse.response)
    expect(fr[0]).toEqual({ result: { count: 2 } })
    expect(fr[1]).toEqual({ result: '{"rows":[1,2]...[truncated 99 chars]' })
    expect(fr[2]).toEqual({ error: "Invalid arguments: days" })
    expect(out.toolCalls).toEqual([{ id: "expiring_enrollments-0", name: "expiring_enrollments", args: { days: 7 } }])
    expect(out.raw).toBe(content)
  })

  it("Gemini 3.x: echoes the model's call id in functionResponse; invented ids are never sent", async () => {
    const llm = gemini()
    const call = id => ({ role: "model", parts: [{ functionCall: { ...(id ? { id } : {}), name: "expiring_enrollments", args: {} }, thoughtSignature: "S" }] })
    // native id
    spy.mockResolvedValueOnce(okJson({ candidates: [{ content: call("call_xyz") }] }))
    const a = await llm.chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS })
    expect(a.toolCalls[0].id).toBe("call_xyz")
    spy.mockResolvedValueOnce(okJson({ candidates: [{ content: { role: "model", parts: [{ text: "done" }] } }] }))
    await llm.chat({ system: "s", tools: TOOLS, messages: [
      { role: "user", content: "x" }, { role: "assistant", text: "", toolCalls: a.toolCalls, raw: a.raw },
      { role: "tool", results: [{ id: "call_xyz", name: "expiring_enrollments", content: "{}", isError: false }] }] })
    const fr1 = JSON.parse(spy.mock.calls[1][1].body).contents[2].parts[0].functionResponse
    expect(fr1).toMatchObject({ id: "call_xyz", name: "expiring_enrollments" })
    // no native id (older model) -> synthetic id, must NOT be sent
    spy.mockResolvedValueOnce(okJson({ candidates: [{ content: call(null) }] }))
    const b = await llm.chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS })
    spy.mockResolvedValueOnce(okJson({ candidates: [{ content: { role: "model", parts: [{ text: "done" }] } }] }))
    await llm.chat({ system: "s", tools: TOOLS, messages: [
      { role: "user", content: "x" }, { role: "assistant", text: "", toolCalls: b.toolCalls, raw: b.raw },
      { role: "tool", results: [{ id: b.toolCalls[0].id, name: "expiring_enrollments", content: "{}", isError: false }] }] })
    const fr2 = JSON.parse(spy.mock.calls[3][1].body).contents[2].parts[0].functionResponse
    expect(fr2).not.toHaveProperty("id")
  })

  it("sends a thinking level (default low, overridable) and logs nothing secret", async () => {
    spy.mockResolvedValue(okJson({ candidates: [{ content: { role: "model", parts: [{ text: "x" }] } }] }))
    await gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS })
    expect(JSON.parse(spy.mock.calls[0][1].body).generationConfig).toEqual({ thinkingConfig: { thinkingLevel: "low" } })
    process.env.GEMINI_THINKING = "medium"
    await gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS })
    expect(JSON.parse(spy.mock.calls[1][1].body).generationConfig.thinkingConfig.thinkingLevel).toBe("medium")
    delete process.env.GEMINI_THINKING
  })

  it("timeout -> readable 504, network failure -> 502 with the cause code", async () => {
    spy.mockRejectedValueOnce(Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }))
    await expect(gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS }))
      .rejects.toMatchObject({ statusCode: 504, message: "LLM request timed out after 60s" })
    spy.mockRejectedValueOnce(Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } }))
    await expect(gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS }))
      .rejects.toMatchObject({ statusCode: 502, message: "LLM network error: ENOTFOUND" })
  })

  it("LLM_TIMEOUT_MS is respected", async () => {
    process.env.LLM_TIMEOUT_MS = "5000"
    spy.mockRejectedValueOnce(Object.assign(new Error("t"), { name: "TimeoutError" }))
    await expect(gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS }))
      .rejects.toMatchObject({ message: "LLM request timed out after 5s" })
    delete process.env.LLM_TIMEOUT_MS
  })

  it("ignores thought parts in the text, and empty candidates -> 502", async () => {
    spy.mockResolvedValueOnce(okJson({ candidates: [{ content: { role: "model", parts: [{ text: "hmm", thought: true }, { text: "answer" }] } }] }))
    const out = await gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS })
    expect(out.text).toBe("answer")
    spy.mockResolvedValueOnce(okJson({ promptFeedback: { blockReason: "SAFETY" } }))
    await expect(gemini().chat({ system: "s", messages: [{ role: "user", content: "x" }], tools: TOOLS }))
      .rejects.toMatchObject({ statusCode: 502 })
  })

  it("missing key -> 503", () => {
    delete process.env.GEMINI_API_KEY
    expect(() => gemini()).toThrow(/GEMINI_API_KEY/)
  })
})