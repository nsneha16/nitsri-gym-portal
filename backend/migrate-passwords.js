// backend/migrate-passwords.js
const envFile = process.argv[2] === "prod" ? ".env.production" : ".env"
require("dotenv").config({ path: envFile })

const db = require("./src/config/db")
const bcrypt = require("bcrypt")

async function migratePasswords() {
  console.log(`Running migration against: ${envFile}`)
  
  const [users] = await db.query("SELECT id, password FROM users")

  for (const user of users) {
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      console.log(`Skipping user ${user.id} — already hashed`)
      continue
    }

    const hashed = await bcrypt.hash(user.password, 10)
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id])
    console.log(`Migrated user ${user.id}`)
  }

  console.log("Migration complete")
  process.exit(0)
}

migratePasswords().catch(err => {
  console.error(err)
  process.exit(1)
})