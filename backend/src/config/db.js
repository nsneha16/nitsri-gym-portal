// db.js — use promise wrapper
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,   // connection pool, not single connection
});
  

// // Pool status — BAHAR rakho, catch ke andar nahi
// setInterval(() => {
//   const pool = db.pool
//   console.log(`
//   ━━━━━━━━━━━━━━━━━━━━━━━━━
//   🏊 Pool Status:
//   Total     : ${pool._allConnections.length}
//   Active    : ${pool._acquiringConnections.length}
//   Free      : ${pool._freeConnections.length}
//   Waiting   : ${pool._connectionQueue.length}
//   ━━━━━━━━━━━━━━━━━━━━━━━━━
//   `)
// }, 5000)

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Database connected");
    connection.release();
  } catch (err) {
    console.log("DB connection failed:", err.message);
    // console.log(process.env.DB_USER);
    // console.log(process.env.DB_PASSWORD);
  }
})();

module.exports = db;
