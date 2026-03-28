const db = require("../config/db")
const AppError = require("../utils/AppError")
const { sendSuccess, sendError } = require("../utils/apiResponse")

exports.enroll = async (req, res, next) => {
  const conn = await db.getConnection()  // 👈 pool se connection lo

  try {
    const { slot_id } = req.body
    const user_id = req.user.id  // JWT se aa raha hai

    if (!slot_id) {
      throw new AppError("Slot ID required", 400)
    }

    // Transaction shuru karo
    await conn.beginTransaction()

    // 🔴 Yahi hai race condition fix — FOR UPDATE
    // Ek waqt mein sirf ek request yeh row lock kar sakti hai
    const [slots] = await conn.query(
      "SELECT * FROM slots WHERE id = ? AND is_active = 1 FOR UPDATE",
      [slot_id]
    )

    if (slots.length === 0) {
      throw new AppError("Slot not found or inactive", 404)
    }

    const slot = slots[0]

    // Seat available hai?
    if (slot.enrolled_count >= slot.capacity) {
      throw new AppError("Slot is full", 409)
    }

    // Student pehle se enrolled toh nahi?
    const [existing] = await conn.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND slot_id = ? AND status != 'cancelled'",
      [user_id, slot_id]
    )

    if (existing.length > 0) {
      throw new AppError("Already enrolled in this slot", 409)
    }

    // Enrollment dates
    const enrolled_date = new Date()
    const expiry_date = new Date()
    expiry_date.setMonth(expiry_date.getMonth() + 1)  // 1 month validity

    // Enrollment insert karo
    await conn.query(
      "INSERT INTO enrollments (user_id, slot_id, status, enrolled_date, expiry_date) VALUES (?, ?, 'confirmed', ?, ?)",
      [user_id, slot_id, enrolled_date, expiry_date]
    )

    // Slot ka count badhao
    await conn.query(
      "UPDATE slots SET enrolled_count = enrolled_count + 1 WHERE id = ?",
      [slot_id]
    )

    // Sab theek — commit karo
    await conn.commit()

    return sendSuccess(res, 201, "Enrollment successful", {
      slot_name: slot.name,
      timing: `${slot.start_time} - ${slot.end_time}`,
      valid_until: expiry_date
    })

  } catch (err) {
    // Kuch bhi galat hua — rollback karo
    await conn.rollback()
    next(err)

  } finally {
    conn.release()  // 👈 connection pool ko wapas do
  }
}

exports.getMyEnrollment = async (req, res, next) => {
  try {
    const user_id = req.user.id

    const [enrollments] = await db.query(
      `SELECT 
        e.id, e.status, e.enrolled_date, e.expiry_date,
        s.name as slot_name, s.start_time, s.end_time, s.days
       FROM enrollments e
       JOIN slots s ON e.slot_id = s.id
       WHERE e.user_id = ? AND e.status = 'confirmed'`,
      [user_id]
    )

    return sendSuccess(res, 200, "Enrollments fetched", { enrollments })

  } catch (err) {
    next(err)
  }
}

exports.cancelEnrollment = async (req, res, next) => {
  const conn = await db.getConnection()

  try {
    const { id } = req.params
    const user_id = req.user.id

    await conn.beginTransaction()

    const [enrollments] = await conn.query(
      "SELECT * FROM enrollments WHERE id = ? AND user_id = ?",
      [id, user_id]
    )

    if (enrollments.length === 0) {
      throw new AppError("Enrollment not found", 404)
    }

    if (enrollments[0].status === 'cancelled') {
      throw new AppError("Already cancelled", 400)
    }

    // Status cancel karo
    await conn.query(
      "UPDATE enrollments SET status = 'cancelled' WHERE id = ?",
      [id]
    )

    // Slot count ghatao
    await conn.query(
      "UPDATE slots SET enrolled_count = enrolled_count - 1 WHERE id = ?",
      [enrollments[0].slot_id]
    )

    await conn.commit()

    return sendSuccess(res, 200, "Enrollment cancelled successfully")

  } catch (err) {
    await conn.rollback()
    next(err)

  } finally {
    conn.release()
  }
}