// Scripted fake LLM for tests / CI. Each step is an object or a function(messages) -> object.
// step shape: { text?, toolCalls?: [{id, name, args}] }
exports.scripted = steps => {
  let i = 0
  return {
    name: "mock",
    calls: [],
    async chat({ messages }) {
      this.calls.push(messages.length)
      const s = steps[Math.min(i++, steps.length - 1)]
      const r = typeof s === "function" ? s(messages) : s
      return { text: r.text || "", toolCalls: r.toolCalls || [], raw: r }
    }
  }
}
