// Login tokens (JWT). After logging in, the website sends the token in every request:
//   Authorization: Bearer <token>
const jwt = require("jsonwebtoken");

function makeToken(user) {
  // user is { role: "customer", id: 1 } or { role: "owner" }
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Reads the token and puts the user on req.user
function readToken(req) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireCustomer(req, res, next) {
  const user = readToken(req);
  if (!user || user.role !== "customer") return res.status(401).json({ error: "Please log in" });
  req.user = user;
  next();
}

function requireOwner(req, res, next) {
  const user = readToken(req);
  if (!user || user.role !== "owner") return res.status(401).json({ error: "Owner login required" });
  req.user = user;
  next();
}

module.exports = { makeToken, requireCustomer, requireOwner };
