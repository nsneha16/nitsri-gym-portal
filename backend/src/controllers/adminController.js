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

// All enrollments — paginated + searchable (by student name or slot name)
exports.getAllEnrollments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ""

    const searchClause = search
      ? `AND (u.name LIKE ? OR s.name LIKE ?)`
      : ""
    const searchParams = search ? [`%${search}%`, `%${search}%`] : []

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN slots s ON e.slot_id = s.id
       WHERE 1=1 ${searchClause}`,
      searchParams
    )

    const [enrollments] = await db.query(
      `SELECT 
        e.id,
        u.name as student_name,
        u.email,
        s.name as slot_name,
        s.start_time,
        s.end_time,
        e.status,
        e.enrolled_date,
        e.expiry_date
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN slots s ON e.slot_id = s.id
      WHERE 1=1 ${searchClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    )

    return sendSuccess(res, 200, "All enrollments", {
      enrollments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// All students — paginated + searchable (by name)
exports.getAllStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ""

    const searchClause = search ? `AND u.name LIKE ?` : ""
    const searchParams = search ? [`%${search}%`] : []

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users u
       WHERE u.role = 'student' ${searchClause}`,
      searchParams
    )

    const [students] = await db.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.department,
        u.year,
        u.is_active,
        u.created_at,
        e.status as enrollment_status,
        s.name as slot_name
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'confirmed'
      LEFT JOIN slots s ON e.slot_id = s.id
      WHERE u.role = 'student' ${searchClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    )

    return sendSuccess(res, 200, "All students", {
      students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// All slots for admin — active + inactive both, paginated
exports.getAllSlots = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM slots"
    )

    const [slots] = await db.query(
      `SELECT id, name, start_time, end_time, days, capacity, enrolled_count, is_active, created_at
       FROM slots
       ORDER BY start_time
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    return sendSuccess(res, 200, "All slots", {
      slots,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
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

exports.getStudentHistory = async (req, res, next) => {
  try {
    const { id } = req.params

    const [users] = await db.query(
      "SELECT id, name, email, department, year, batch FROM users WHERE id = ?",
      [id]
    )

    if (users.length === 0) throw new AppError("Student not found", 404)

    const [enrollments] = await db.query(
      `SELECT 
        e.id,
        e.status,
        e.enrolled_date,
        e.expiry_date,
        s.name as slot_name,
        s.start_time,
        s.end_time,
        s.days
       FROM enrollments e
       JOIN slots s ON e.slot_id = s.id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`,
      [id]
    )

    return sendSuccess(res, 200, "Student history fetched", {
      student: users[0],
      enrollments
    })

  } catch (err) {
    next(err)
  }
}