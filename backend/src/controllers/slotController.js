const db = require("../config/db")

// GET /api/slots — sabhi active slots
exports.getAllSlots = async (req, res) => {
  try {
    const [slots] = await db.query(
      "SELECT * FROM slots WHERE is_active = 1 ORDER BY start_time"
    )
    res.status(200).json({ slots })

  } catch (err) {
    console.error("Get slots error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
}

// POST /api/slots — naya slot banao (admin only)
exports.createSlot = async (req, res) => {
  try {
    const { name, start_time, end_time, days, capacity } = req.body

    if (!name || !start_time || !end_time || !days || !capacity) {
      return res.status(400).json({ message: "All fields required" })
    }

    await db.query(
      "INSERT INTO slots (name, start_time, end_time, days, capacity) VALUES (?, ?, ?, ?, ?)",
      [name, start_time, end_time, days, capacity]
    )

    res.status(201).json({ message: "Slot created successfully" })

  } catch (err) {
    console.error("Create slot error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
}

// PATCH /api/slots/:id — slot update karo (admin only)
exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params
    const { capacity, is_active } = req.body

    await db.query(
      "UPDATE slots SET capacity = ?, is_active = ? WHERE id = ?",
      [capacity, is_active, id]
    )

    res.status(200).json({ message: "Slot updated successfully" })

  } catch (err) {
    console.error("Update slot error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
}