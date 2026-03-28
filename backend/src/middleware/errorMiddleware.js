const { sendError } = require("../utils/apiResponse")

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message)

  // Agar AppError hai toh uska message use karo
  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message)
  }

  // MySQL errors — meaningful message do
  if (err.code === "ER_DUP_ENTRY") {
    return sendError(res, 409, "Already exists — duplicate entry")
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return sendError(res, 400, "Referenced record does not exist")
  }

  // Default
  return sendError(res, 500, "Something went wrong, please try again")
}

module.exports = errorHandler