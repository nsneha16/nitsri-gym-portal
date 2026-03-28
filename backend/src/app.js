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

// All routes yahan aayenge
app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/slots", require("./routes/slotRoutes"))
app.use("/api/enrollments", require("./routes/enrollmentRoutes"))

app.use(errorHandler)
app.use(cors({
  origin: "*",  // abhi sab allow karo, baad mein restrict karenge
  credentials: true
}))
module.exports = app
