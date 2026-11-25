// Customer view. Every route here needs a customer login,
// and only returns that customer's own data (req.user.id).
const express = require("express");
const { query } = require("../db");
const { requireCustomer } = require("../auth");
const { getRepairDetails, REPAIR_LIST_SQL } = require("../repairs");

const router = express.Router();
router.use(requireCustomer);

// GET /api/my/account - my account
router.get("/account", async (req, res) => {
  const [me] = await query(
    "select id, first_name, last_name, phone, email from customers where id = $1", [req.user.id]);
  res.json(me);
});

// GET /api/my/vehicles
router.get("/vehicles", async (req, res) => {
  res.json(await query("select * from vehicles where customer_id = $1 order by id", [req.user.id]));
});

// POST /api/my/vehicles  { vin, year, make, model, plate, odometer }
router.post("/vehicles", async (req, res) => {
  const { vin, year, make, model, plate, odometer } = req.body;
  if (!vin) return res.status(400).json({ error: "VIN is required" });
  const [vehicle] = await query(
    `insert into vehicles (customer_id, vin, year, make, model, plate, odometer)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [req.user.id, vin, year, make, model, plate, odometer]);
  res.status(201).json(vehicle);
});

// GET /api/my/repairs - all my repairs with services, parts, approvals, and totals
router.get("/repairs", async (req, res) => {
  const repairs = await query(
    REPAIR_LIST_SQL + " where r.customer_id = $1 order by r.appt_date desc", [req.user.id]);
  const full = [];
  for (const r of repairs) full.push(await getRepairDetails(r));
  res.json(full);
});

// POST /api/my/repairs - book an appointment
// { vehicle_id, appt_date: "2026-11-20", appt_time: "09:00", concern, service_ids: [2, 3] }
router.post("/repairs", async (req, res) => {
  const { vehicle_id, appt_date, appt_time, concern, service_ids = [] } = req.body;
  if (!vehicle_id || !appt_date || !appt_time) {
    return res.status(400).json({ error: "Vehicle, date, and time are required" });
  }
  // Make sure the car belongs to this customer
  const [car] = await query(
    "select id from vehicles where id = $1 and customer_id = $2", [vehicle_id, req.user.id]);
  if (!car) return res.status(404).json({ error: "Vehicle not found" });

  const [repair] = await query(
    `insert into repairs (customer_id, vehicle_id, concern, appt_date, appt_time)
     values ($1, $2, $3, $4, $5) returning *`,
    [req.user.id, vehicle_id, concern, appt_date, appt_time]);
  for (const id of service_ids) {
    await query("insert into repair_services (repair_id, service_id) values ($1, $2)", [repair.id, id]);
  }
  res.status(201).json(await getRepairDetails(repair));
});

// PATCH /api/my/approvals/:id  { status: "approved" or "declined" }
router.patch("/approvals/:id", async (req, res) => {
  const { status } = req.body;
  if (status !== "approved" && status !== "declined") {
    return res.status(400).json({ error: "Status must be approved or declined" });
  }
  // Only update if the approval is on one of this customer's repairs
  const [approval] = await query(
    `update approvals a set status = $1
     from repairs r
     where a.id = $2 and a.repair_id = r.id and r.customer_id = $3
     returning a.*`,
    [status, req.params.id, req.user.id]);
  if (!approval) return res.status(404).json({ error: "Approval not found" });
  res.json(approval);
});

module.exports = router;
