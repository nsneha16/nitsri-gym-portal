const AppError = require("../../utils/AppError")

let override = null
exports.setProvider = p => { override = p }          // used by tests

exports.getProvider = () => {
  if (override) return override
  const name = (process.env.LLM_PROVIDER || "").toLowerCase()
  if (name === "groq") return require("./groq")()
  if (name === "anthropic") return require("./anthropic")()
 
  if (name === "gemini") return require("./gemini")()
  throw new AppError("LLM provider not configured (set LLM_PROVIDER=gemini|anthropic and its API key)", 503)
}
async function runWithFallback(providers, opts) {
  let last
  for (const llm of providers) {
    const r = await runAgent({ ...opts, llm })
    if (r.status !== "llm_unavailable") return r
    last = r
  }
  return last
}
