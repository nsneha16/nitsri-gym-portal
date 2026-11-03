const URL = "https://api.groq.com/openai/v1/chat/completions"

function toOpenAIMessages(system, messages) {
  const out = [{ role: "system", content: system }]
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content })
    } else if (m.role === "assistant") {
      const msg = { role: "assistant", content: m.text || null }
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map(c => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.args || {}) },
        }))
      }
      out.push(msg)
    } else if (m.role === "tool") {
      for (const r of m.results) {
        out.push({ role: "tool", tool_call_id: r.id, content: r.content })
      }
    }
  }
  return out
}

function createGroqProvider({
  apiKey = process.env.GROQ_API_KEY,
  model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile", // docs me current model name check kar lena
} = {}) {
  if (!apiKey) throw new Error("GROQ_API_KEY missing")

  return {
    name: `groq:${model}`,
    async chat({ system, messages, tools }) {
      const body = {
        model,
        max_completion_tokens: 1500,
        messages: toOpenAIMessages(system, messages),
        temperature: 0.2,
      }
      if (/gpt-oss/i.test(model)) body.reasoning_effort = "low"
      if (tools?.length) {
        body.tools = tools.map(t => ({
          type: "function",
          function: { name: t.name, description: t.description, parameters: t.schema },
        }))
        body.tool_choice = "auto"
      }

      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
     
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        const err = new Error(`LLM error ${res.status}: ${txt.slice(0, 400)}`)
        const ra = Number(res.headers.get("retry-after"))
        if (ra) err.retryAfterMs = ra * 1000
        throw err
      }

      const data = await res.json()
      const msg = data.choices?.[0]?.message || {}
      const toolCalls = (msg.tool_calls || []).map(c => {
        let args = {}
        try { args = JSON.parse(c.function.arguments || "{}") } catch { args = {} }
        return { id: c.id, name: c.function.name, args }
      })

      // return { text: msg.content || "", toolCalls, raw: msg }
      return { text: msg.content || "", toolCalls, raw: msg, usage: data.usage }
    },
  }
}

module.exports = createGroqProvider 