const AppError = require("../utils/AppError")
const { sendSuccess } = require("../utils/apiResponse")
const { runAgent } = require("../agent/loop")
const { tools } = require("../agent/tools")
const { getProvider } = require("../agent/providers")

// tiny in-memory limiter: LLM calls cost money. 15 requests / minute / admin.
const hits = new Map()
const allow = id => {
  const now = Date.now()
  const h = (hits.get(id) || []).filter(t => now - t < 60000)
  if (h.length >= 15) { hits.set(id, h); return false }
  h.push(now); hits.set(id, h)
  return true
}
exports.__resetLimiter = () => hits.clear()

// POST /api/admin/agent/chat   { "message": "..." }
exports.chat = async (req, res, next) => {
  try {
    const msg = req.body && req.body.message
    if (typeof msg !== "string" || !msg.trim()) throw new AppError("message is required", 400)
    if (msg.length > 1000) throw new AppError("message too long (max 1000 chars)", 400)
    if (!allow(req.user.id)) throw new AppError("Too many requests, slow down", 429)

    const out = await runAgent({ llm: getProvider(), message: msg.trim(), tools })
    return sendSuccess(res, 200, "Agent response", out)
  } catch (err) { next(err) }
}
