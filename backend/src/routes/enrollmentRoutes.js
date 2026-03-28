const express = require("express")
const router = express.Router()
const enrollmentController = require("../controllers/enrollmentController")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/", authMiddleware, enrollmentController.enroll)
router.get("/my", authMiddleware, enrollmentController.getMyEnrollment)
router.delete("/:id", authMiddleware, enrollmentController.cancelEnrollment)

module.exports = router