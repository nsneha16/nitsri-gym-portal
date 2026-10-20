const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const authMiddleware = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/isAdmin")

// Saare admin routes pe auth + admin check ek hi jagah
router.use(authMiddleware, isAdmin)

router.get("/dashboard", adminController.getDashboard)
router.get("/enrollments", adminController.getAllEnrollments)
router.get("/students", adminController.getAllStudents)
router.patch("/slots/:id/toggle", adminController.toggleSlot)
router.get("/students/:id/history", adminController.getStudentHistory)
router.get("/slots", adminController.getAllSlots)

module.exports = router