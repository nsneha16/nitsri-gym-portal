const db = require("../config/db")

// confirmed + expiry_date nikal chuki enrollments ko 'expired' karo aur seats wapas do
module.exports = async function expireEnrollments() {
  const c = await db.getConnection()
  try {
    // READ COMMITTED: gap locks nahi lagte, enroll ke INSERT se deadlock nahi hoga
    await c.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
    await c.beginTransaction()

    // FOR UPDATE: 2 runs ek saath chale to double-decrement nahi hoga
    const [rows] = await c.query(
      "SELECT id, slot_id FROM enrollments WHERE status = 'confirmed' AND expiry_date < CURDATE() FOR UPDATE"
    )
    if (rows.length === 0) {
      await c.commit()
      return 0
    }

    await c.query(
      "UPDATE enrollments SET status = 'expired' WHERE id IN (?)",
      [rows.map(r => r.id)]
    )

    const cnt = {}
    rows.forEach(r => { cnt[r.slot_id] = (cnt[r.slot_id] || 0) + 1 })
    for (const sid in cnt) {
      await c.query(
        "UPDATE slots SET enrolled_count = GREATEST(enrolled_count - ?, 0) WHERE id = ?",
        [cnt[sid], sid]
      )
    }

    await c.commit()
    return rows.length
  } catch (err) {
    await c.rollback()
    throw err
  } finally {
    c.release()
  }
}