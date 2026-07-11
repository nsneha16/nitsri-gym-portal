const express = require("express")
const router = express.Router()
const profileController = require("../controllers/profileController")
const authMiddleware = require("../middleware/authMiddleware")

router.get("/", authMiddleware, profileController.getProfile)
router.patch("/", authMiddleware, profileController.updateProfile)

module.exports = router