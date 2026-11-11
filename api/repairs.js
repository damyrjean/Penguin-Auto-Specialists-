// Gets everything about a repair: services, parts, approvals, and the invoice total.
// Used by both the customer and owner routes.
const { query } = require("./db");

const TAX_RATE = 0.07; // 7% Florida sales tax

async function getRepairDetails(repair) {
  const services = await query(
    `select s.id, s.name, s.price
     from repair_services rs join services s on s.id = rs.service_id
     where rs.repair_id = $1`, [repair.id]);

  const parts = await query(
    `select p.id, p.name, p.price, rp.qty
     from repair_parts rp join parts p on p.id = rp.part_id
     where rp.repair_id = $1`, [repair.id]);

  const approvals = await query(
    `select * from approvals where repair_id = $1 order by id`, [repair.id]);

  // Add up services + parts + approved extra work, then tax
  let subtotal = 0;
  services.forEach(s => subtotal += Number(s.price));
  parts.forEach(p => subtotal += Number(p.price) * p.qty);
  approvals.filter(a => a.status === "approved").forEach(a => subtotal += Number(a.price));

  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return { ...repair, services, parts, approvals, subtotal, tax, total };
}

// Repairs with the customer name, car, and technician name filled in
const REPAIR_LIST_SQL = `
  select r.*,
         c.first_name || ' ' || c.last_name as customer_name,
         v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
         e.name as technician_name
  from repairs r
  join customers c on c.id = r.customer_id
  join vehicles v on v.id = r.vehicle_id
  left join employees e on e.id = r.technician_id`;

module.exports = { getRepairDetails, REPAIR_LIST_SQL };
