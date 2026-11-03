const svc = require("../services/insightsService")

// {value} | {error}. Accepts 7 or "7" (LLMs sometimes send numbers as strings).
const int = (v, def, lo, hi, name) => {
  if (v === undefined || v === null) return { value: def }
  if (typeof v === "string" && /^\d+$/.test(v)) v = Number(v)
  if (typeof v !== "number" || !Number.isInteger(v)) return { error: `${name} must be an integer` }
  if (v < lo || v > hi) return { error: `${name} must be between ${lo} and ${hi}` }
  return { value: v }
}
const obj = a => (a && typeof a === "object" && !Array.isArray(a) ? a : {})

// READ-ONLY tools. No tool here can change data or message anyone.
const tools = [
  {
    name: "slots_by_fill",
    description:
      "List all gym slots with enrolled count, capacity, open seats and fill percentage, sorted by fill. " +
      "Use for questions about crowded, empty or popular slots.",
    schema: {
      type: "object",
      properties: {
        order: { type: "string", enum: ["desc", "asc"], description: "desc = fullest first (default), asc = emptiest first" },
        only_active: { type: "boolean", description: "true = only slots currently open for booking" }
      }
    },
    validate(args) {
      const a = obj(args)
      if (a.order !== undefined && !["desc", "asc"].includes(a.order)) return { error: 'order must be "desc" or "asc"' }
      if (a.only_active !== undefined && typeof a.only_active !== "boolean") return { error: "only_active must be a boolean" }
      return { value: { order: a.order || "desc", onlyActive: !!a.only_active } }
    },
    run: a => svc.slotsByFill(a)
  },
  {
    name: "expiring_enrollments",
    description:
      "List active enrollments that expire within the next N days (student, slot, expiry date, days left). " +
      "Use for questions about who needs to renew soon.",
    schema: {
      type: "object",
      properties: { days: { type: "integer", description: "Look-ahead window in days, 1-60 (default 7)" } }
    },
    validate(args) {
      const d = int(obj(args).days, 7, 1, 60, "days")
      return d.error ? d : { value: { days: d.value } }
    },
    run: a => svc.expiring(a.days)
  },
    {
    name: "slot_students",
    description:
      "List all students with an active enrollment in ONE slot (name, department, year, expiry date, days left), " +
      "soonest expiry first. Use for questions about who is in a specific slot. Get the slot_code from slots_by_fill first.",
    schema: {
      type: "object",
      properties: { slot_code: { type: "string", description: "Slot code such as MS1 or ES4" } },
      required: ["slot_code"]
    },
    validate(args) {
      const c = obj(args).slot_code
      if (typeof c !== "string" || !/^[A-Za-z0-9_-]{1,10}$/.test(c.trim())) return { error: "slot_code must be a short code like ES4" }
      return { value: { slot_code: c.trim().toUpperCase() } }
    },
    run: a => svc.slotStudents(a.slot_code)
  },
  {
    name: "at_risk_students",
    description:
      "Rank students whose enrollment expires soon by how likely they are NOT to renew. Returns a risk score, " +
      "a high/medium/low label and the reasons. Rule-based heuristic, not a trained model.",
    schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Only enrollments expiring within this many days, 1-60 (default 7)" },
        limit: { type: "integer", description: "Max students to return, 1-50 (default 10)" }
      }
    },
    validate(args) {
      const a = obj(args)
      const d = int(a.days, 7, 1, 60, "days"); if (d.error) return d
      const l = int(a.limit, 10, 1, 50, "limit"); if (l.error) return l
      return { value: { days: d.value, limit: l.value } }
    },
    run: a => svc.atRisk(a.days, a.limit)
  }
]

module.exports = { tools }
