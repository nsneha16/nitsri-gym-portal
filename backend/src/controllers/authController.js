const db = require("../config/db")
const generateToken = require("../utils/generateToken")
const AppError = require("../utils/AppError")
const { sendSuccess, sendError } = require("../utils/apiResponse")

exports.signup = async (req, res, next) => {  // 👈 next add kiya
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      throw new AppError("Name, email and password are required", 400)
    }

    if (!email.endsWith("@nitsri.ac.in")) {
      throw new AppError("Only college emails allowed", 400)
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?", [email]
    )

    if (existingUsers.length > 0) {
      throw new AppError("User already exists", 409)
    }

    // TODO: hash password with bcrypt before production
    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    )

    return sendSuccess(res, 201, "Signup successful")

  } catch (err) {
    next(err)  // 👈 error middleware ko bhejo, yahan handle mat karo
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError("Email and password are required", 400)
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?", [email]
    )

    if (users.length === 0) {
      throw new AppError("No account found with this email", 404)
    }

    const user = users[0]

    // TODO: replace with bcrypt.compare before production
    if (user.password !== password) {
      throw new AppError("Incorrect password", 401)
    }

    const token = generateToken(user)

    return sendSuccess(res, 200, "Login successful", {
      user: { id: user.id, name: user.name, email: user.email, role: user.role,},
      token
    })

  } catch (err) {
    next(err)
  }
}