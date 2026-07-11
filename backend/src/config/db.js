// db.js — use promise wrapper
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,   // connection pool, not single connection
  ssl: {                             
    rejectUnauthorized: false 
  }
});


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
