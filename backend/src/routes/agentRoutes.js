const express = require("express")
const router = express.Router()
const agentController = require("../controllers/agentController")
const authMiddleware = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/isAdmin")

router.post("/chat", authMiddleware, isAdmin, agentController.chat)

module.exports = router
