// db.js — use promise wrapper
require("dns").setDefaultResultOrder("ipv4first")
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,   // connection pool, not single connection
    connectTimeout: 20000,
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
    // console.log("DB connection failed:", err.message);
    // console.log(process.env.DB_USER);
    // console.log(process.env.DB_PASSWORD);
        console.log("DB connection failed:", err.message, err.code, err.address, err.port)
  }
})();

const dns = require("dns"), net = require("net")
dns.lookup(process.env.DB_HOST, { all: true }, (e, a) => {
  console.log("DNS:", e ? e.code : JSON.stringify(a))
  ;(a || []).forEach(({ address }) => {
    const s = net.connect({ host: address, port: Number(process.env.DB_PORT), timeout: 8000 })
    s.on("connect", () => { console.log("TCP ok", address); s.destroy() })
    s.on("timeout", () => { console.log("TCP timeout", address); s.destroy() })
    s.on("error", er => console.log("TCP error", address, er.code))
  })
})
module.exports = db;
