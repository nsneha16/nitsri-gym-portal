const AppError = require("../../utils/AppError")

module.exports = () => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new AppError("ANTHROPIC_API_KEY is not set", 503)
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"
  return {
    name: `anthropic:${model}`,
    async chat({ system, messages, tools }) {
      const body = {
        model, max_tokens: 1024, system,
        tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.schema })),
        messages: messages.map(m =>
          m.role === "user" ? { role: "user", content: m.content }
          : m.role === "assistant" ? { role: "assistant", content: m.raw }   // raw blocks replayed as-is
          : { role: "user", content: m.results.map(r => ({ type: "tool_result", tool_use_id: r.id, content: r.content, is_error: r.isError })) })
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new AppError(`LLM error ${res.status}: ${data?.error?.message || "unknown"}`, 502)
      const blocks = data.content || []
      return {
        text: blocks.filter(b => b.type === "text").map(b => b.text).join(""),
        toolCalls: blocks.filter(b => b.type === "tool_use").map(b => ({ id: b.id, name: b.name, args: b.input || {} })),
        raw: blocks
      }
    }
  }
}
