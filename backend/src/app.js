const express = require("express")
const cors = require("cors")
const app = express()
const errorHandler = require("./middleware/errorMiddleware")

// Middleware
app.use(cors())
app.use(express.json())

// Health routes
app.get("/", (req, res) => res.send("Gym backend running"))
app.get("/health", (req, res) => res.json({
  status: "OK",
  message: "Server healthy",
  time: new Date()
}))

// Specific /api/admin/* routes pehle, general /api/admin baad me
app.use("/api/admin/agent", require("./routes/agentRoutes"))
app.use("/api/admin/insights", require("./routes/insightRoutes"))

app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/slots", require("./routes/slotRoutes"))
app.use("/api/enrollments", require("./routes/enrollmentRoutes"))
app.use("/api/admin", require("./routes/adminRoutes"))
app.use("/api/profile", require("./routes/profileRoutes"))

// Error handler hamesha sabse last
app.use(errorHandler)

module.exports = app