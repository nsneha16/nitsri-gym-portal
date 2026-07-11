const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const authMiddleware = require("../middleware/authMiddleware")

// Admin middleware — role check
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: "Admin only" })
  }
  next()
}

router.get("/dashboard", authMiddleware, isAdmin, adminController.getDashboard)
router.get("/enrollments", authMiddleware, isAdmin, adminController.getAllEnrollments)
router.get("/students", authMiddleware, isAdmin, adminController.getAllStudents)
router.patch("/slots/:id/toggle", authMiddleware, isAdmin, adminController.toggleSlot)

module.exports = router