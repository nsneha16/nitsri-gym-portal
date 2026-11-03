// Real-LLM smoke test.  Run from backend/:   node scripts/agent-smoke.js "your question"
// Needs in .env:  LLM_PROVIDER=gemini  GEMINI_API_KEY=...   (or LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=...)
require("dotenv").config()
const { runAgent } = require("../src/agent/loop")
const { tools } = require("../src/agent/tools")
const { getProvider } = require("../src/agent/providers")
const db = require("../src/config/db")

;(async () => {
  const q = process.argv.slice(2).join(" ") || "Slot with highest booking, and which enrollments are getting expired in next 7 days?"
  const llm = getProvider()
  console.log("provider:", llm.name, "\nquestion:", q, "\n")
  const out = await runAgent({ llm, message: q, tools })
  console.log(JSON.stringify(out, null, 2))
  await db.end()
})().catch(e => { console.error("FAILED:", e.message); process.exit(1) })
