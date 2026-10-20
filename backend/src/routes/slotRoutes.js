const express = require("express")
const router = express.Router()
const slotController = require("../controllers/slotController")
const authMiddleware = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/isAdmin")

// Student  should be loggged in
router.get("/", authMiddleware, slotController.getAllSlots)

// Admin —  mek slot , update it
router.post("/", authMiddleware, isAdmin, slotController.createSlot)
router.patch("/:id", authMiddleware, isAdmin, slotController.updateSlot)

module.exports = router