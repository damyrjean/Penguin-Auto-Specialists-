// Connects to the PostgreSQL database (Supabase) using DATABASE_URL from .env
const { Pool, types } = require("pg");

// Send dates as "2026-11-20" and prices as numbers (pg's defaults are a timestamp and text)
types.setTypeParser(1082, value => value);             // date
types.setTypeParser(1700, value => parseFloat(value)); // numeric

const url = process.env.DATABASE_URL;
const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false } // Supabase needs SSL
});

// Run a query and return the rows. Use $1, $2... for values to stop SQL injection.
async function query(sql, values = []) {
  const result = await pool.query(sql, values);
  return result.rows;
}

module.exports = { query, pool };
