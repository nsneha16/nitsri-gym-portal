const db = require("../config/db")
const { sendSuccess } = require("../utils/apiResponse")
const AppError = require("../utils/AppError")

// Dashboard stats
exports.getDashboard = async (req, res, next) => {
  try {
    const [[{ totalStudents }]] = await db.query(
      "SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'"
    )
    const [[{ totalSlots }]] = await db.query(
      "SELECT COUNT(*) as totalSlots FROM slots WHERE is_active = 1"
    )
    const [[{ activeEnrollments }]] = await db.query(
      "SELECT COUNT(*) as activeEnrollments FROM enrollments WHERE status = 'confirmed'"
    )

    return sendSuccess(res, 200, "Dashboard data", {
      totalStudents,
      totalSlots,
      activeEnrollments
    })
  } catch (err) {
    next(err)
  }
}

// All enrollments — slotwise
exports.getAllEnrollments = async (req, res, next) => {
  try {
    const [enrollments] = await db.query(`
      SELECT 
        e.id,
        u.name as student_name,
        u.email,
        u.college_id,
        s.name as slot_name,
        s.start_time,
        s.end_time,
        e.status,
        e.enrolled_date,
        e.expiry_date
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN slots s ON e.slot_id = s.id
      ORDER BY e.created_at DESC
    `)

    return sendSuccess(res, 200, "All enrollments", { enrollments })
  } catch (err) {
    next(err)
  }
}

// All students
exports.getAllStudents = async (req, res, next) => {
  try {
    const [students] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.college_id,
        u.department,
        u.year,
        u.is_active,
        u.created_at,
        e.status as enrollment_status,
        s.name as slot_name
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'confirmed'
      LEFT JOIN slots s ON e.slot_id = s.id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `)

    return sendSuccess(res, 200, "All students", { students })
  } catch (err) {
    next(err)
  }
}

// Slot toggle — active/inactive
exports.toggleSlot = async (req, res, next) => {
  try {
    const { id } = req.params

    const [[slot]] = await db.query(
      "SELECT is_active FROM slots WHERE id = ?", [id]
    )

    if (!slot) throw new AppError("Slot not found", 404)

    await db.query(
      "UPDATE slots SET is_active = ? WHERE id = ?",
      [!slot.is_active, id]
    )

    return sendSuccess(res, 200, `Slot ${slot.is_active ? 'deactivated' : 'activated'}`)
  } catch (err) {
    next(err)
  }
}