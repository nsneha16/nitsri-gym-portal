const express = require("express")
const router = express.Router()
const slotController = require("../controllers/slotController")
const authMiddleware = require("../middleware/authMiddleware")

// Student — sabhi slots dekho (login hona chahiye)
router.get("/", authMiddleware, slotController.getAllSlots)

// Admin — slot banao, update karo
router.post("/", authMiddleware, slotController.createSlot)
router.patch("/:id", authMiddleware, slotController.updateSlot)

module.exports = router