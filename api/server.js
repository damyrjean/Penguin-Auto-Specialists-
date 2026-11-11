// Penguin Auto Specialists API
// Start it with:  npm run dev
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { query } = require("./db");

const app = express();
app.use(cors());          // lets the website (different address) call the API
app.use(express.json());  // reads JSON request bodies into req.body

// Check that the API and database are working: GET /api/health
app.get("/api/health", async (req, res) => {
  await query("select 1");
  res.json({ ok: true });
});

// Service menu is public, so people can see prices before signing up
app.get("/api/services", async (req, res) => {
  res.json(await query("select * from services order by id"));
});

app.use("/api", require("./routes/auth"));
app.use("/api/owner", require("./routes/owner"));   // owner view
app.use("/api/my", require("./routes/customer"));    // customer view

// Unknown address
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// If anything goes wrong, send a clear message instead of crashing
app.use((err, req, res, next) => {
  if (err.code === "23505") return res.status(400).json({ error: "That already exists" });
  if (err.code === "23503") return res.status(400).json({ error: "That record is linked to something else" });
  if (err.code === "22P02" || err.code === "22007" || err.code === "22008") {
    return res.status(400).json({ error: "A value is in the wrong format" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
