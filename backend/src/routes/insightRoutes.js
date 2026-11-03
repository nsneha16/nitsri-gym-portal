const express = require("express")
const router = express.Router()
const ctrl = require("../controllers/insightsController")
const authMiddleware = require("../middleware/authMiddleware")
const isAdmin = require("../middleware/isAdmin")

// Admin-only read tools (these are the agent's tools later)
router.use(authMiddleware, isAdmin)

router.get("/slots-by-fill", ctrl.slotsByFill)
router.get("/expiring", ctrl.expiring)
router.get("/at-risk", ctrl.atRisk)

module.exports = router
