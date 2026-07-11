const jwt = require("jsonwebtoken")
require("dotenv").config()

function generateToken(user){
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },  
    process.env.JWT_SECRET,                                
    { expiresIn: "10h" }
  )
}

module.exports = generateToken
