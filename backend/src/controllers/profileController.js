const db = require("../config/db")
const AppError = require("../utils/AppError")
const { sendSuccess } = require("../utils/apiResponse")

exports.getProfile = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, department, year, 
       batch, role, profile_complete, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    )

    if (users.length === 0) throw new AppError("User not found", 404)

    return sendSuccess(res, 200, "Profile fetched", { user: users[0] })

  } catch (err) {
    next(err)
  }
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, year, batch } = req.body

    if (!name || !department || !year || !batch) {
      throw new AppError("All fields required", 400)
    }

    await db.query(
      `UPDATE users 
       SET name = ?, department = ?, year = ?, 
       batch = ?, profile_complete = TRUE 
       WHERE id = ?`,
      [name, department, year, batch, req.user.id]
    )

    return sendSuccess(res, 200, "Profile updated successfully")

  } catch (err) {
    next(err)
  }
}