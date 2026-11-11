// Owner view. Every route here needs the owner login.
const express = require("express");
const { query } = require("../db");
const { requireOwner } = require("../auth");
const { getRepairDetails, REPAIR_LIST_SQL } = require("../repairs");

const router = express.Router();
router.use(requireOwner);

// ---------- Basic list / add / edit / delete ----------
// These tables all work the same way, so one function makes the 4 routes for each.
// "fields" is the list of columns the owner is allowed to set.
function basicRoutes(table, fields, select = "*") {
  // GET /api/owner/customers
  router.get(`/${table}`, async (req, res) => {
    res.json(await query(`select ${select} from ${table} order by id`));
  });

  // POST /api/owner/customers  { first_name: "...", ... }
  router.post(`/${table}`, async (req, res) => {
    const cols = fields.filter(f => req.body[f] !== undefined);
    if (!cols.length) return res.status(400).json({ error: "Nothing to save" });
    const values = cols.map(f => req.body[f]);
    const places = cols.map((f, i) => `$${i + 1}`);
    const [row] = await query(
      `insert into ${table} (${cols.join(", ")}) values (${places.join(", ")}) returning ${select}`, values);
    res.status(201).json(row);
  });

  // PATCH /api/owner/customers/5  { phone: "..." }
  router.patch(`/${table}/:id`, async (req, res) => {
    const cols = fields.filter(f => req.body[f] !== undefined);
    if (!cols.length) return res.status(400).json({ error: "Nothing to update" });
    const values = cols.map(f => req.body[f]);
    const sets = cols.map((f, i) => `${f} = $${i + 1}`);
    const [row] = await query(
      `update ${table} set ${sets.join(", ")} where id = $${cols.length + 1} returning ${select}`,
      [...values, req.params.id]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });

  // DELETE /api/owner/customers/5
  router.delete(`/${table}/:id`, async (req, res) => {
    const rows = await query(`delete from ${table} where id = $1 returning id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  });
}

basicRoutes("customers", ["first_name", "last_name", "phone", "email"],
  "id, first_name, last_name, phone, email"); // never send passwords
basicRoutes("vehicles", ["customer_id", "vin", "year", "make", "model", "plate", "odometer"]);
basicRoutes("employees", ["name", "role", "phone", "active"]);
basicRoutes("services", ["name", "price", "hours", "checklist"]);
basicRoutes("parts", ["name", "sku", "stock", "reorder", "cost", "price"]);
basicRoutes("transactions", ["repair_id", "date", "amount", "status"]);

// ---------- Repairs ----------

// GET /api/owner/repairs            all repairs
// GET /api/owner/repairs?status=Ready   only one status
router.get("/repairs", async (req, res) => {
  const repairs = req.query.status
    ? await query(REPAIR_LIST_SQL + " where r.status = $1 order by r.appt_date, r.appt_time", [req.query.status])
    : await query(REPAIR_LIST_SQL + " order by r.appt_date desc, r.appt_time");
  res.json(repairs);
});

// GET /api/owner/repairs/4 - one repair with services, parts, approvals, and invoice total
router.get("/repairs/:id", async (req, res) => {
  const [repair] = await query(REPAIR_LIST_SQL + " where r.id = $1", [req.params.id]);
  if (!repair) return res.status(404).json({ error: "Not found" });
  res.json(await getRepairDetails(repair));
});

// PATCH /api/owner/repairs/4  { status, technician_id, appt_date, appt_time, concern }
router.patch("/repairs/:id", async (req, res) => {
  const fields = ["status", "technician_id", "appt_date", "appt_time", "concern"];
  const cols = fields.filter(f => req.body[f] !== undefined);
  if (!cols.length) return res.status(400).json({ error: "Nothing to update" });
  const sets = cols.map((f, i) => `${f} = $${i + 1}`);
  const [repair] = await query(
    `update repairs set ${sets.join(", ")} where id = $${cols.length + 1} returning *`,
    [...cols.map(f => req.body[f]), req.params.id]);
  if (!repair) return res.status(404).json({ error: "Not found" });
  res.json(repair);
});

// POST /api/owner/repairs/4/services  { service_id }
router.post("/repairs/:id/services", async (req, res) => {
  // "on conflict do nothing" skips it if the service is already on the repair
  await query(
    "insert into repair_services (repair_id, service_id) values ($1, $2) on conflict do nothing",
    [req.params.id, req.body.service_id]);
  res.status(201).json({ added: true });
});

// POST /api/owner/repairs/4/parts  { part_id, qty }  - also takes the parts out of stock
router.post("/repairs/:id/parts", async (req, res) => {
  const qty = req.body.qty || 1;
  const [part] = await query("select stock from parts where id = $1", [req.body.part_id]);
  if (!part) return res.status(404).json({ error: "Part not found" });
  if (part.stock < qty) return res.status(400).json({ error: "Not enough in stock" });

  // If the part is already on the repair, add to its quantity instead
  await query(
    `insert into repair_parts (repair_id, part_id, qty) values ($1, $2, $3)
     on conflict (repair_id, part_id) do update set qty = repair_parts.qty + $3`,
    [req.params.id, req.body.part_id, qty]);
  await query("update parts set stock = stock - $1 where id = $2", [qty, req.body.part_id]);
  res.status(201).json({ added: true });
});

// POST /api/owner/repairs/4/approvals  { title, note, price, photo_url } - ask the customer to approve extra work
router.post("/repairs/:id/approvals", async (req, res) => {
  const { title, note, price, photo_url } = req.body;
  if (!title || price === undefined) return res.status(400).json({ error: "Title and price are required" });
  const [approval] = await query(
    `insert into approvals (repair_id, title, note, price, photo_url)
     values ($1, $2, $3, $4, $5) returning *`,
    [req.params.id, title, note, price, photo_url]);
  res.status(201).json(approval);
});

// ---------- Overview page ----------

// GET /api/owner/overview - numbers for the owner dashboard
router.get("/overview", async (req, res) => {
  const [today] = await query("select count(*)::int as count from repairs where appt_date = current_date");
  const [open] = await query(
    "select count(*)::int as count from repairs where status in ('Requested', 'Scheduled', 'In Progress', 'Ready')");
  const [revenue] = await query(
    `select coalesce(sum(amount), 0)::float as total from transactions
     where status = 'Paid' and date >= date_trunc('month', current_date)`);
  const lowStock = await query("select * from parts where stock <= reorder order by name");
  res.json({
    appointments_today: today.count,
    open_repairs: open.count,
    revenue_this_month: revenue.total,
    low_stock_parts: lowStock
  });
});

module.exports = router;
