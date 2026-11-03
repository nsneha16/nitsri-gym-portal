const db = require("../config/db")
const AppError = require("../utils/AppError")
const { sendSuccess } = require("../utils/apiResponse")

// College calendar assumptions (same as ml/simulate.py) - tune to your campus
const BRK = [6, 12]
const EXM = [10, 12, 3, 5]

// strict int query-param parser: default if missing, 400 if junk / out of range
const intArg = (v, def, lo, hi, name) => {
  if (v === undefined) return def
  if (!/^\d+$/.test(String(v))) throw new AppError(`${name} must be an integer`, 400)
  const n = Number(v)
  if (n < lo || n > hi) throw new AppError(`${name} must be between ${lo} and ${hi}`, 400)
  return n
}

// GET /api/admin/insights/slots-by-fill?order=desc|asc&only_active=1
exports.slotsByFill = async (req, res, next) => {
  try {
    const order = req.query.order === "asc" ? "ASC" : "DESC"
    const onlyActive = req.query.only_active === "1"
    const [rows] = await db.query(
      `SELECT id AS slot_id, name, slot_code, capacity, enrolled_count,
              capacity - enrolled_count AS open_seats,
              ROUND(enrolled_count / capacity * 100, 1) AS fill_pct, is_active
       FROM slots ${onlyActive ? "WHERE is_active = 1" : ""}
       ORDER BY fill_pct ${order}, id`
    )
    return sendSuccess(res, 200, "Slots by fill", { count: rows.length, slots: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/insights/expiring?days=7
exports.expiring = async (req, res, next) => {
  try {
    const days = intArg(req.query.days, 7, 1, 60, "days")
    const [rows] = await db.query(
      `SELECT e.id AS enrollment_id, u.id AS user_id, u.name, u.email, u.department, u.year,
              s.slot_code, s.name AS slot_name,
              DATE_FORMAT(e.expiry_date, '%Y-%m-%d') AS expiry_date,
              DATEDIFF(e.expiry_date, CURDATE()) AS days_left
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN slots s ON s.id = e.slot_id
       WHERE e.status = 'confirmed'
         AND e.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY e.expiry_date, e.id`,
      [days]
    )
    return sendSuccess(res, 200, `Enrollments expiring in ${days} days`, { days, count: rows.length, enrollments: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/insights/at-risk?days=7&limit=10
// Rule-based, explainable score. The ML model plugs in here later (same response shape).
exports.atRisk = async (req, res, next) => {
  try {
    const days = intArg(req.query.days, 7, 1, 60, "days")
    const limit = intArg(req.query.limit, 10, 1, 50, "limit")

    const [rows] = await db.query(
      `SELECT e.id AS enrollment_id, u.id AS user_id, u.name, u.email, u.department, u.year,
              s.slot_code, s.capacity, s.enrolled_count,
              DATE_FORMAT(e.expiry_date, '%Y-%m-%d') AS expiry_date,
              MONTH(e.expiry_date) AS exp_month,
              DATEDIFF(e.expiry_date, CURDATE()) AS days_left
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN slots s ON s.id = e.slot_id
       WHERE e.status = 'confirmed'
         AND e.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [days]
    )
    if (rows.length === 0) {
      return sendSuccess(res, 200, "No enrollments expiring", { days, count: 0, students: [] })
    }

    const ids = [...new Set(rows.map(r => r.user_id))]
    const [hist] = await db.query(
      `SELECT user_id, COUNT(*) AS total, SUM(status = 'cancelled') AS cancels
       FROM enrollments WHERE user_id IN (?) GROUP BY user_id`,
      [ids]
    )
    const hm = new Map(hist.map(h => [h.user_id, h]))

    const out = rows.map(r => {
      const h = hm.get(r.user_id) || { total: 1, cancels: 0 }
      const total = Number(h.total), cancels = Number(h.cancels)
      const fill = r.capacity ? r.enrolled_count / r.capacity : 0
      let score = 0
      const why = []
      if (total === 1) { score += 2; why.push("first enrollment (no history)") }
      if (cancels > 0) { score += Math.min(cancels, 2); why.push(`${cancels} past cancellation(s)/switch(es)`) }
      if (fill > 0.9) { score += 1; why.push("crowded slot (>90% full)") }
      if (BRK.includes(r.exp_month)) {
        score += 1; why.push("expires in a break month")
        if (r.year === 4) { score += 1; why.push("final-year student") }
      } else if (EXM.includes(r.exp_month)) {
        score += 0.5; why.push("expires in an exam month")
      }
      return {
        enrollment_id: r.enrollment_id, user_id: r.user_id, name: r.name, email: r.email,
        department: r.department, year: r.year, slot_code: r.slot_code,
        expiry_date: r.expiry_date, days_left: r.days_left,
        risk_score: score, risk: score >= 3 ? "high" : score >= 1.5 ? "medium" : "low", reasons: why
      }
    })
    out.sort((a, b) => b.risk_score - a.risk_score || a.days_left - b.days_left || a.enrollment_id - b.enrollment_id)

    return sendSuccess(res, 200, "At-risk students", {
      days, count: out.length, returned: Math.min(limit, out.length), students: out.slice(0, limit)
    })
  } catch (err) {
    next(err)
  }
}
