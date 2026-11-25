// Sign up and log in
const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { makeToken } = require("../auth");

const router = express.Router();

// POST /api/register  { first_name, last_name, phone, email, password }
router.post("/register", async (req, res) => {
  const { first_name, last_name, phone, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: "First name, last name, email, and password are required" });
  }
  const hashed = await bcrypt.hash(password, 10);

  const existing = await query("select * from customers where email = $1", [email]);
  let customer;
  if (existing.length && existing[0].password) {
    return res.status(400).json({ error: "An account with that email already exists" });
  } else if (existing.length) {
    // Customer was added by the shop but never set a password. Let them claim the account.
    [customer] = await query(
      "update customers set password = $1 where id = $2 returning *", [hashed, existing[0].id]);
  } else {
    [customer] = await query(
      `insert into customers (first_name, last_name, phone, email, password)
       values ($1, $2, $3, $4, $5) returning *`,
      [first_name, last_name, phone, email, hashed]);
  }

  delete customer.password;
  res.status(201).json({ token: makeToken({ role: "customer", id: customer.id }), customer });
});

// POST /api/login  { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [customer] = await query("select * from customers where email = $1", [email]);
  if (!customer || !customer.password || !(await bcrypt.compare(password || "", customer.password))) {
    return res.status(401).json({ error: "Wrong email or password" });
  }
  delete customer.password;
  res.json({ token: makeToken({ role: "customer", id: customer.id }), customer });
});

// POST /api/owner/login  { password }   (password is OWNER_PASSWORD in .env)
router.post("/owner/login", (req, res) => {
  if (req.body.password !== process.env.OWNER_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  res.json({ token: makeToken({ role: "owner" }) });
});

module.exports = router;
