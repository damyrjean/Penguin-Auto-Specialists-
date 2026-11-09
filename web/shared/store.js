// Shared data layer for both views. Tables match the project schema:
// customers, vehicles, repairs, employees, parts, services, transactions.
// It saves to localStorage for now. To go live, replace load() and save()
// with calls to the Express API; the pages only talk to this object.
const PA = (() => {
  const KEY = "penguin-auto-v1";
  const iso = offset => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const photo = (label, color) => "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="${color}"/><circle cx="160" cy="84" r="46" fill="none" stroke="#fff" stroke-width="10"/><circle cx="160" cy="84" r="14" fill="#fff"/><text x="160" y="164" fill="#fff" font-family="Arial" font-size="15" text-anchor="middle">${label}</text></svg>`);

  const seed = () => ({
    session: { customerId: 98421 },
    settings: { shopName: "Penguin Auto Specialists", phone: "(386) 555-0142", address: "100 Sample St, Palm Coast, FL 32164", hours: "Mon to Sat, 8:00 AM to 5:30 PM", timezone: "Eastern Time", taxRate: 7 },
    customers: [
      { id: 98421, first: "User", last: "Customer", phone: "(386) 555-0101", email: "user@example.com" },
      { id: 98422, first: "Renee", last: "Caldwell", phone: "(386) 555-0102", email: "renee@example.com" },
      { id: 98423, first: "Tomas", last: "Alvarez", phone: "(386) 555-0103", email: "tomas@example.com" },
      { id: 98424, first: "Priya", last: "Nair", phone: "(386) 555-0104", email: "priya@example.com" }
    ],
    vehicles: [
      { vin: "1FTFW1E85MFA00001", customerId: 98421, year: 2021, make: "Ford", model: "F-150", trim: "SuperCrew Cab, Lariat, 3.5L V6 EcoBoost", plate: "7XYZ99 (FL)", odometer: 59250, primary: true },
      { vin: "2HGFC2F59JH500002", customerId: 98421, year: 2018, make: "Honda", model: "Civic", trim: "LX Sedan, 2.0L I4", plate: "KLM 482 (FL)", odometer: 81420, primary: false },
      { vin: "5TDZA23C86S500003", customerId: 98422, year: 2019, make: "Toyota", model: "Sienna", trim: "LE, 3.5L V6", plate: "PQT 310 (FL)", odometer: 72880, primary: true },
      { vin: "1G1ZD5ST5KF100004", customerId: 98423, year: 2019, make: "Chevrolet", model: "Malibu", trim: "LT, 1.5L Turbo", plate: "RDH 774 (FL)", odometer: 66105, primary: true },
      { vin: "5NPD84LF1LH500005", customerId: 98424, year: 2020, make: "Hyundai", model: "Elantra", trim: "SEL, 2.0L I4", plate: "BVC 219 (FL)", odometer: 40312, primary: true }
    ],
    employees: [
      { id: 1, name: "Dave Rollins", role: "Service Advisor", phone: "(386) 555-0120", active: true },
      { id: 2, name: "Luis Ortega", role: "Master Technician", phone: "(386) 555-0121", active: true },
      { id: 3, name: "Kayla Brooks", role: "Technician", phone: "(386) 555-0122", active: true },
      { id: 4, name: "Sam Whitfield", role: "Technician", phone: "(386) 555-0123", active: true }
    ],
    services: [
      { id: 1, name: "60,000 Mile Maintenance", price: 245, hours: 2.5, checks: ["Full engine spark plug check", "Transmission fluid exchange and line flush", "On road suspension damper check"] },
      { id: 2, name: "Synthetic Oil Change", price: 79.95, hours: 0.5, checks: ["Oil and filter", "Fluid top off", "Tire pressure check"] },
      { id: 3, name: "Tire Rotation and Balance", price: 59.95, hours: 0.75, checks: ["Rotate all four tires", "Balance", "Tread depth check"] },
      { id: 4, name: "Brake Inspection", price: 49.95, hours: 0.5, checks: ["Pad and rotor measurement", "Brake fluid test"] },
      { id: 5, name: "AC Service", price: 149.95, hours: 1.25, checks: ["Recover and recharge", "Leak check", "Vent temperature test"] },
      { id: 6, name: "Diagnostic Inspection", price: 110, hours: 1, checks: ["Code scan", "Road test", "Written findings"] }
    ],
    parts: [
      { id: 1, name: "Front Brake Pad Set", sku: "BP-1140", stock: 6, reorder: 4, cost: 38, price: 72, onOrder: 0 },
      { id: 2, name: "Front Brake Rotor", sku: "BR-2207", stock: 3, reorder: 4, cost: 46, price: 89, onOrder: 0 },
      { id: 3, name: "Oil Filter", sku: "OF-0031", stock: 24, reorder: 10, cost: 4, price: 11, onOrder: 0 },
      { id: 4, name: "Cabin Air Filter", sku: "CF-0310", stock: 9, reorder: 5, cost: 9, price: 28, onOrder: 0 },
      { id: 5, name: "Serpentine Belt", sku: "SB-4420", stock: 2, reorder: 3, cost: 21, price: 54, onOrder: 4 },
      { id: 6, name: "Wiper Blade Pair", sku: "WB-1800", stock: 14, reorder: 6, cost: 12, price: 32, onOrder: 0 }
    ],
    repairs: [
      { id: 4913, customerId: 98421, vin: "2HGFC2F59JH500002", status: "In Progress", techId: 2, concern: "Grinding noise when braking", date: iso(0), time: "8:30 AM", services: [4], parts: [],
        approvals: [{ id: 1, title: "Replace front pads and rotors", note: "Front pads are down to 2 mm and the rotors are scored.", price: 322, status: "pending", photo: photo("Front left rotor", "#475569") }] },
      { id: 4914, customerId: 98421, vin: "1FTFW1E85MFA00001", status: "Scheduled", techId: 3, concern: "", date: iso(1), time: "9:00 AM", services: [1], parts: [], approvals: [] },
      { id: 4915, customerId: 98422, vin: "5TDZA23C86S500003", status: "Requested", techId: null, concern: "AC blows warm at idle", date: iso(2), time: "10:30 AM", services: [5], parts: [], approvals: [] },
      { id: 4916, customerId: 98423, vin: "1G1ZD5ST5KF100004", status: "Ready", techId: 4, concern: "", date: iso(0), time: "11:00 AM", services: [2, 3], parts: [{ partId: 3, qty: 1 }], approvals: [] },
      { id: 4890, customerId: 98421, vin: "1FTFW1E85MFA00001", status: "Completed", techId: 2, concern: "", date: iso(-64), time: "9:30 AM", services: [2, 3], parts: [{ partId: 3, qty: 1 }], approvals: [] },
      { id: 4851, customerId: 98421, vin: "2HGFC2F59JH500002", status: "Completed", techId: 3, concern: "AC not cold", date: iso(-132), time: "1:00 PM", services: [5], parts: [{ partId: 4, qty: 1 }], approvals: [] },
      { id: 4902, customerId: 98424, vin: "5NPD84LF1LH500005", status: "Completed", techId: 4, concern: "", date: iso(-3), time: "2:00 PM", services: [2], parts: [{ partId: 3, qty: 1 }], approvals: [] }
    ],
    transactions: [
      { id: 7001, repairId: 4890, date: iso(-64), method: "Card", status: "Paid" },
      { id: 7002, repairId: 4851, date: iso(-132), method: "Cash", status: "Paid" },
      { id: 7003, repairId: 4902, date: iso(-3), method: "Card", status: "Paid" }
    ]
  });

  let db;
  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { db = null; }
    if (!db) { db = seed(); save(); }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { return false; }
  }
  load();

  const by = (list, field, value) => list.find(x => x[field] === value);
  const nextId = list => Math.max(0, ...list.map(x => x.id)) + 1;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const date = s => parse(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const shortDate = s => parse(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const relative = s => {
    const days = Math.round((parse(s) - parse(iso(0))) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 1 ? `In ${days} days` : shortDate(s);
  };
  const vehicleName = v => v ? `${v.year} ${v.make} ${v.model}` : "";
  const customerName = c => c ? `${c.first} ${c.last}` : "";

  function lines(r) {
    const out = [];
    r.services.forEach(id => { const s = by(db.services, "id", id); if (s) out.push({ label: s.name, qty: 1, amount: s.price }); });
    r.parts.forEach(p => { const part = by(db.parts, "id", p.partId); if (part) out.push({ label: part.name, qty: p.qty, amount: part.price * p.qty }); });
    r.approvals.filter(a => a.status === "approved").forEach(a => out.push({ label: a.title, qty: 1, amount: a.price }));
    return out;
  }
  function totals(r) {
    const items = lines(r);
    const subtotal = items.reduce((sum, l) => sum + l.amount, 0);
    const tax = Math.round(subtotal * db.settings.taxRate) / 100;
    return { items, subtotal, tax, total: subtotal + tax };
  }
  function invoiceHtml(r) {
    const t = totals(r), c = by(db.customers, "id", r.customerId), v = by(db.vehicles, "vin", r.vin);
    return `<div class="invoice-head"><div><h2>${esc(db.settings.shopName)}</h2><p class="muted">${esc(db.settings.address)}<br>${esc(db.settings.phone)}</p></div>
      <div class="right"><b>Invoice for RO #${r.id}</b><p class="muted">${shortDate(r.date)}<br>${esc(customerName(c))}<br>${esc(vehicleName(v))}</p></div></div>
      <table class="table"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Amount</th></tr></thead><tbody>
      ${t.items.map(l => `<tr><td>${esc(l.label)}</td><td class="right">${l.qty}</td><td class="right">${money(l.amount)}</td></tr>`).join("")}</tbody></table>
      <div class="totals"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Tax (${db.settings.taxRate}%)</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>`;
  }
  function showInvoice(r) {
    let dlg = document.getElementById("invoice-dialog");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "invoice-dialog"; dlg.className = "dialog"; document.body.append(dlg); }
    dlg.innerHTML = `<div id="invoice-body">${invoiceHtml(r)}</div><div class="dialog-foot no-print"><button class="btn btn-ghost" data-close>Close</button><button class="btn" data-print>Print</button></div>`;
    dlg.querySelector("[data-close]").onclick = () => dlg.close();
    dlg.querySelector("[data-print]").onclick = () => window.print();
    dlg.showModal();
  }
  function statusTag(s) {
    const cls = { Requested: "amber", Scheduled: "blue", "In Progress": "blue", Ready: "green", Completed: "gray", Cancelled: "red" }[s] || "gray";
    return `<span class="tag tag-${cls}">${esc(s)}</span>`;
  }

  const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const truck = '<path d="M5 17H3v-5l2-5h9l4 5h3v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>';
  const icons = {
    truck: I(truck), home: I('<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>'),
    calendar: I('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    wrench: I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
    phone: I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    pin: I('<path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
    users: I('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M18 15c2.500.7 4 2.800 4 6"/>'),
    box: I('<path d="m3 8 9-5 9 5v8l-9 5-9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
    list: I('<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
    card: I('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
    check: I('<path d="m5 12 5 5 9-10"/>')
  };

  return { get db() { return db; }, load, save, by, nextId, esc, money, date, shortDate, relative, iso, vehicleName, customerName, lines, totals, invoiceHtml, showInvoice, statusTag, icons, reset() { db = seed(); save(); } };
})();
