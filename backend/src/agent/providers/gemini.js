const AppError = require("../../utils/AppError")

// Gemini's Schema enum is upper-case (STRING, INTEGER, BOOLEAN, OBJECT)
const toGem = s => {
  if (Array.isArray(s)) return s.map(toGem)
  if (s && typeof s === "object") {
    return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === "type" && typeof v === "string" ? v.toUpperCase() : toGem(v)]))
  }
  return s
}

// tool results are JSON strings, except errors / truncated text -> keep those as plain strings
const safeParse = s => { try { return JSON.parse(s) } catch { return s } }

module.exports = () => {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new AppError("GEMINI_API_KEY is not set", 503)
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash"   // override via .env if your key lists another model
  const ms = Number(process.env.LLM_TIMEOUT_MS) || 60000          // per request
  const think = process.env.GEMINI_THINKING || "low"              // low | medium | high  (Gemini 3.x thinking depth)
  const synthetic = new Set()   // call ids we invented (older models send none); Gemini 3.x sends real ones
  return {
    name: `gemini:${model}`,
    async chat({ system, messages, tools }) {
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { thinkingConfig: { thinkingLevel: think } },
        tools: [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: toGem(t.schema) })) }],
        contents: messages.map(m =>
          m.role === "user" ? { role: "user", parts: [{ text: m.content }] }
          : m.role === "assistant" ? m.raw   // model content replayed as-is (keeps Gemini 3 thought signatures)
          : { role: "user", parts: m.results.map(r => ({ functionResponse: { ...(synthetic.has(r.id) ? {} : { id: r.id }), name: r.name, response: r.isError ? { error: r.content } : { result: safeParse(r.content) } } })) })
      }
      let res
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          signal: AbortSignal.timeout(ms),
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(body)
        })
      } catch (e) {
        if (e.name === "TimeoutError" || e.name === "AbortError") throw new AppError(`LLM request timed out after ${ms / 1000}s`, 504)
        throw new AppError(`LLM network error: ${(e.cause && e.cause.code) || e.message}`, 502)   // e.g. ENOTFOUND, UND_ERR_CONNECT_TIMEOUT
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new AppError(`LLM error ${res.status}: ${data?.error?.message || "unknown"}`, 502)
      const content = data.candidates?.[0]?.content
      if (!content) throw new AppError("LLM returned no content (blocked or empty)", 502)
      const parts = content.parts || []
      return {
        text: parts.filter(p => p.text && !p.thought).map(p => p.text).join(""),
        toolCalls: parts.filter(p => p.functionCall).map((p, i) => {
          const id = p.functionCall.id || `${p.functionCall.name}-${i}`
          if (!p.functionCall.id) synthetic.add(id)
          return { id, name: p.functionCall.name, args: p.functionCall.args || {} }
        }),
        raw: content
      }
    }
  }
}