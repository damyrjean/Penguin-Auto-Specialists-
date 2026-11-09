// Owner website. One page with hash routes: #overview, #repairs, #repair/4913, and so on.
const { esc, money, by, icons } = PA;
const root = document.getElementById("root");
const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];
const NAV = [["overview", "home", "Overview"], ["repairs", "wrench", "Repairs"], ["customers", "users", "Customers"], ["vehicles", "truck", "Vehicles"], ["employees", "user", "Employees"], ["parts", "box", "Parts"], ["services", "list", "Services"], ["transactions", "card", "Transactions"], ["settings", "gear", "Settings"]];
let repairFilter = "Open";

const db = () => PA.db;
const cust = r => by(db().customers, "id", r.customerId);
const veh = r => by(db().vehicles, "vin", r.vin);
const techName = r => by(db().employees, "id", r.techId)?.name;
const txFor = id => by(db().transactions, "repairId", id);
const isLocked = r => ["Completed", "Cancelled"].includes(r.status);
const pendingCount = r => r.approvals.filter(a => a.status === "pending").length;
const lowStock = () => db().parts.filter(p => p.stock <= p.reorder);
const field = (label, input, cls = "") => `<label class="field ${cls}">${label}${input}</label>`;

function toast(text) {
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
  document.body.append(t); setTimeout(() => t.remove(), 3000);
}
function commit(message) {
  const ok = PA.save();
  if (!ok) { PA.load(); toast("Could not save. Browser storage is full."); }
  else if (message) toast(message);
  render();
  return ok;
}
function shell(active, title, sub, body) {
  root.innerHTML = `<div class="app"><aside class="sidebar">
    <div class="brand"><div class="brand-logo">${icons.truck}</div><div><div class="brand-name">Penguin Auto</div><div class="brand-sub">Owner Dashboard</div></div></div>
    <nav class="nav" aria-label="Main">${NAV.map(([id, icon, label]) => `<a href="#${id}" class="nav-item ${id === active ? "active" : ""}" ${id === active ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
    <div class="user"><div class="user-avatar">${icons.user}</div><div><div class="user-name">Shop Owner</div><div class="user-id">Administrator</div></div></div>
    <a class="switch-link" href="../customer/">Switch to customer view</a>
  </aside><main class="main"><header class="page-header"><div><h1>${esc(title)}</h1><p class="muted">${sub}</p></div></header>${body}</main></div>`;
}
const table = (heads, rows, empty = "Nothing here yet.") => rows.length
  ? `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h => h.startsWith(">") ? `<th class="right">${h.slice(1)}</th>` : `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
  : `<p class="muted">${empty}</p>`;
const repairRow = r => {
  const v = veh(r), c = cust(r);
  return `<tr><td><a class="link" href="#repair/${r.id}">#${r.id}</a></td><td>${esc(PA.customerName(c))}</td><td>${esc(PA.vehicleName(v))}</td><td>${PA.shortDate(r.date)}, ${esc(r.time)}</td><td>${esc(techName(r) || "Unassigned")}</td><td>${PA.statusTag(r.status)}${pendingCount(r) ? ` <span class="tag tag-amber">Awaiting customer</span>` : ""}</td></tr>`;
};
const REPAIR_HEADS = ["RO", "Customer", "Vehicle", "Date", "Technician", "Status"];
const sorted = list => [...list].sort((a, b) => a.date.localeCompare(b.date));

function overview() {
  const open = sorted(db().repairs.filter(r => OPEN.includes(r.status)));
  const requests = open.filter(r => r.status === "Requested");
  const month = PA.iso(0).slice(0, 7);
  const revenue = db().transactions.filter(t => t.status === "Paid" && t.date.startsWith(month)).reduce((n, t) => n + PA.totals(by(db().repairs, "id", t.repairId)).total, 0);
  const stat = (label, value, href) => `<a class="card" href="${href}"><div class="muted">${label}</div><div class="stat-value">${value}</div></a>`;
  shell("overview", "Overview", "Everything happening in the shop today.", `<div class="stats">
    ${stat("Open repairs", open.length, "#repairs")}${stat("New requests", requests.length, "#repairs")}${stat("Low stock parts", lowStock().length, "#parts")}${stat("Paid this month", money(revenue), "#transactions")}</div>
    <div class="stack">
    ${requests.length ? `<section class="card"><h2>New Appointment Requests</h2><br>${table(["RO", "Customer", "Vehicle", "Requested for", "Service", ""], requests.map(r => `<tr><td><a class="link" href="#repair/${r.id}">#${r.id}</a></td><td>${esc(PA.customerName(cust(r)))}</td><td>${esc(PA.vehicleName(veh(r)))}</td><td>${PA.shortDate(r.date)}, ${esc(r.time)}</td><td>${esc(r.services.map(id => by(db().services, "id", id)?.name).join(", ") || r.concern)}</td><td class="right"><button class="btn btn-sm" data-accept="${r.id}">Accept</button></td></tr>`))}</section>` : ""}
    <section class="card"><h2>Open Repairs</h2><br>${table(REPAIR_HEADS, open.map(repairRow), "No open repairs.")}</section></div>`);
  root.querySelectorAll("[data-accept]").forEach(b => b.onclick = () => { by(db().repairs, "id", Number(b.dataset.accept)).status = "Scheduled"; commit("Appointment accepted."); });
}

function repairs() {
  const filters = ["Open", "Requested", "Scheduled", "In Progress", "Ready", "Completed", "Cancelled", "All"];
  const list = db().repairs.filter(r => repairFilter === "All" || (repairFilter === "Open" ? OPEN.includes(r.status) : r.status === repairFilter));
  shell("repairs", "Repairs", "Every repair order in the shop.", `<section class="card"><div class="row" style="margin-bottom:14px"><label class="field" style="width:200px">Show<select id="filter">${filters.map(f => `<option ${f === repairFilter ? "selected" : ""}>${f}</option>`).join("")}</select></label></div>${table(REPAIR_HEADS, sorted(list).map(repairRow), "No repairs match this filter.")}</section>`);
  document.getElementById("filter").onchange = e => { repairFilter = e.target.value; render(); };
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / img.width), c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function repairDetail(id) {
  const r = by(db().repairs, "id", id);
  if (!r) return shell("repairs", "Repair not found", `<a class="link" href="#repairs">Back to repairs</a>`, "");
  const c = cust(r), v = veh(r), t = PA.totals(r), tx = txFor(r.id), locked = isLocked(r), off = locked ? "disabled" : "";
  const statuses = ["Requested", "Scheduled", "In Progress", "Ready"].concat(tx ? [] : ["Cancelled"]);
  const options = locked ? [r.status] : statuses;
  const techs = db().employees.filter(e => e.active && e.role !== "Service Advisor");
  const svcRows = r.services.map(sid => { const s = by(db().services, "id", sid); return s ? `<tr><td>${esc(s.name)}</td><td class="right">${money(s.price)}</td><td class="right">${locked ? "" : `<button class="btn btn-ghost btn-sm" data-rm-svc="${sid}">Remove</button>`}</td></tr>` : ""; });
  const partRows = r.parts.map(p => { const part = by(db().parts, "id", p.partId); return part ? `<tr><td>${esc(part.name)} x ${p.qty}</td><td class="right">${money(part.price * p.qty)}</td><td class="right">${locked ? "" : `<button class="btn btn-ghost btn-sm" data-rm-part="${p.partId}">Remove</button>`}</td></tr>` : ""; });
  const approved = r.approvals.filter(a => a.status === "approved").map(a => `<tr><td>${esc(a.title)} (approved)</td><td class="right">${money(a.price)}</td><td></td></tr>`);
  const billAction = locked ? (tx ? `<button class="btn btn-ghost" id="view-inv">View Invoice</button>` : "")
    : tx ? `<button class="btn btn-ghost" id="view-inv">View Invoice</button><select id="method" aria-label="Payment method" style="width:120px"><option>Card</option><option>Cash</option><option>Check</option></select><button class="btn" id="pay">Record Payment</button>`
    : `<button class="btn" id="invoice" ${pendingCount(r) || !t.items.length ? "disabled" : ""}>Generate Invoice</button>${pendingCount(r) ? `<span class="muted">Waiting on customer approval.</span>` : ""}`;
  shell("repairs", `Repair Order #${r.id}`, `${esc(PA.customerName(c))}, ${esc(c.phone)}<br>${esc(PA.vehicleName(v))}, ${esc(v.plate)}, ${v.odometer.toLocaleString("en-US")} mi`, `<div class="grid"><div class="col">
    <section class="card stack"><div class="card-head" style="margin:0"><h2>Work Order</h2>${PA.statusTag(r.status)}</div>
      ${r.concern ? `<p class="muted"><b>Customer concern:</b> ${esc(r.concern)}</p>` : ""}
      <p class="muted"><b>Appointment:</b> ${PA.date(r.date)}, ${esc(r.time)}</p>
      <div class="form-grid">${field("Status", `<select id="status" ${off}>${options.map(s => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}</select>`)}
      ${field("Technician", `<select id="tech" ${off}><option value="">Unassigned</option>${techs.map(e => `<option value="${e.id}" ${e.id === r.techId ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>`)}</div></section>
    <section class="card stack"><h2>Services and Parts</h2>${table(["Item", ">Amount", ""], [...svcRows, ...partRows, ...approved], "No line items yet.")}
      ${locked ? "" : `<div class="form-grid"><div class="row" style="flex-wrap:nowrap">${field("Add service", `<select id="add-svc">${db().services.filter(s => !r.services.includes(s.id)).map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>`, "grow")}<button class="btn btn-ghost" style="align-self:flex-end" id="add-svc-btn">Add</button></div>
      <div class="row" style="flex-wrap:nowrap">${field("Add part", `<select id="add-part">${db().parts.map(p => `<option value="${p.id}" ${p.stock ? "" : "disabled"}>${esc(p.name)} (${p.stock} left)</option>`).join("")}</select>`, "grow")}<button class="btn btn-ghost" style="align-self:flex-end" id="add-part-btn">Add</button></div></div>`}</section>
    <section class="card stack"><h2>Customer Approvals</h2>
      ${r.approvals.map(a => `<div class="approval"><img src="${esc(a.photo)}" alt="${esc(a.title)}"><div class="approval-body"><div class="row between"><b>${esc(a.title)}</b><span class="price">${money(a.price)}</span></div><p class="muted">${esc(a.note)}</p><div><span class="tag tag-${{ pending: "amber", approved: "green", declined: "red" }[a.status]}">${{ pending: "Waiting on customer", approved: "Approved", declined: "Declined" }[a.status]}</span></div></div></div>`).join("") || `<p class="muted">No approvals requested.</p>`}
      ${locked ? "" : `<form id="ask" class="form-grid" novalidate><hr class="span-2" style="margin:0">
        ${field("Work needed", `<input name="title" required>`)}${field("Price", `<input name="price" type="number" min="0.01" step="0.01" required>`)}
        ${field("Note to customer", `<input name="note">`, "span-2")}${field("Photo", `<input name="photo" type="file" accept="image/*" required>`, "span-2")}
        <p class="error span-2" id="ask-err" role="alert"></p><button class="btn span-2">Send to Customer</button></form>`}</section></div>
    <section class="card upcoming"><h2>Invoice</h2><div class="totals" style="margin:12px 0"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Tax (${db().settings.taxRate}%)</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>
      ${tx ? `<p class="muted" style="margin-bottom:10px">Transaction #${tx.id}: ${esc(tx.status)}${tx.method ? `, ${esc(tx.method)}` : ""}</p>` : ""}<div class="row">${billAction}</div></section></div>`);
  const $ = s => document.getElementById(s);
  if (locked) { if ($("view-inv")) $("view-inv").onclick = () => PA.showInvoice(r); return; }
  $("status").onchange = e => {
    if (e.target.value === "Cancelled") {
      if (!confirm("Cancel this repair order? Parts return to stock.")) return render();
      r.parts.forEach(p => { const part = by(db().parts, "id", p.partId); if (part) part.stock += p.qty; });
      r.parts = [];
    }
    r.status = e.target.value; commit("Status updated. The customer can see it now.");
  };
  $("tech").onchange = e => { r.techId = e.target.value ? Number(e.target.value) : null; commit("Technician assigned."); };
  root.querySelectorAll("[data-rm-svc]").forEach(b => b.onclick = () => { r.services = r.services.filter(x => x !== Number(b.dataset.rmSvc)); commit(); });
  root.querySelectorAll("[data-rm-part]").forEach(b => b.onclick = () => { const id = Number(b.dataset.rmPart), line = by(r.parts, "partId", id), part = by(db().parts, "id", id); if (part) part.stock += line.qty; r.parts = r.parts.filter(p => p.partId !== id); commit(); });
  $("add-svc-btn").onclick = () => { const val = Number($("add-svc").value); if (val) { r.services.push(val); commit(); } };
  $("add-part-btn").onclick = () => {
    const part = by(db().parts, "id", Number($("add-part").value));
    if (!part || part.stock < 1) return toast("That part is out of stock.");
    const line = by(r.parts, "partId", part.id);
    if (line) line.qty++; else r.parts.push({ partId: part.id, qty: 1 });
    part.stock--; commit();
  };
  $("ask").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, err = $("ask-err"), title = f.title.value.trim(), price = Number(f.price.value), file = f.photo.files[0];
    if (!title) return err.textContent = "Describe the work.";
    if (!(price > 0)) return err.textContent = "Enter a price.";
    if (!file) return err.textContent = "Add a photo so the customer can see the problem.";
    let data;
    try { data = await resizePhoto(file); } catch (x) { return err.textContent = "That file could not be read as an image."; }
    r.approvals.push({ id: PA.nextId(r.approvals), title, note: f.note.value.trim(), price, status: "pending", photo: data });
    commit("Sent to the customer for approval.");
  };
  if ($("invoice")) $("invoice").onclick = () => { db().transactions.push({ id: PA.nextId(db().transactions), repairId: r.id, date: PA.iso(0), method: "", status: "Unpaid" }); commit("Invoice created."); };
  if ($("view-inv")) $("view-inv").onclick = () => PA.showInvoice(r);
  if ($("pay")) $("pay").onclick = () => { Object.assign(tx, { status: "Paid", method: $("method").value, date: PA.iso(0) }); r.status = "Completed"; commit("Payment recorded. Repair completed."); };
}

function customers() {
  shell("customers", "Customers", "Everyone with an account.", `<section class="card">${table(["ID", "Name", "Phone", "Email", "Vehicles", "Open repairs"], db().customers.map(c => `<tr><td>#${c.id}</td><td>${esc(PA.customerName(c))}</td><td>${esc(c.phone)}</td><td>${esc(c.email)}</td><td>${db().vehicles.filter(v => v.customerId === c.id).length}</td><td>${db().repairs.filter(r => r.customerId === c.id && OPEN.includes(r.status)).length}</td></tr>`))}</section>`);
}
function vehicles() {
  shell("vehicles", "Vehicles", "All vehicles on file.", `<section class="card">${table(["Vehicle", "VIN", "Plate", "Owner", ">Odometer"], db().vehicles.map(v => `<tr><td>${esc(PA.vehicleName(v))}</td><td>${esc(v.vin)}</td><td>${esc(v.plate)}</td><td>${esc(PA.customerName(by(db().customers, "id", v.customerId)))}</td><td class="right">${v.odometer.toLocaleString("en-US")} mi</td></tr>`))}</section>`);
}
function employees() {
  shell("employees", "Employees", "Staff and technician workload.", `<div class="grid"><section class="card">${table(["Name", "Role", "Phone", "Open jobs", ""], db().employees.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.role)}</td><td>${esc(e.phone)}</td><td>${db().repairs.filter(r => r.techId === e.id && OPEN.includes(r.status)).length}</td><td class="right"><button class="btn btn-ghost btn-sm" data-toggle="${e.id}">${e.active ? "Deactivate" : "Activate"}</button></td></tr>`))}</section>
    <section class="card"><h2>Add Employee</h2><form id="add" class="stack" style="gap:12px;margin-top:12px" novalidate>${field("Name", `<input name="name" required>`)}${field("Role", `<select name="role"><option>Technician</option><option>Master Technician</option><option>Service Advisor</option></select>`)}${field("Phone", `<input name="phone" type="tel">`)}<p class="error" id="err" role="alert"></p><button class="btn">Add</button></form></section></div>`);
  root.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => { const e = by(db().employees, "id", Number(b.dataset.toggle)); e.active = !e.active; commit(); });
  document.getElementById("add").onsubmit = ev => { ev.preventDefault(); const f = ev.target, name = f.name.value.trim(); if (!name) return document.getElementById("err").textContent = "Enter a name."; db().employees.push({ id: PA.nextId(db().employees), name, role: f.role.value, phone: f.phone.value.trim(), active: true }); commit("Employee added."); };
}
function parts() {
  shell("parts", "Parts", "Inventory and orders. Low stock items are flagged.", `<div class="grid"><section class="card">${table(["Part", "SKU", ">In stock", ">On order", ">Price", ""], db().parts.map(p => `<tr><td>${esc(p.name)} ${p.stock <= p.reorder ? `<span class="tag tag-amber">Low</span>` : ""}</td><td>${esc(p.sku)}</td><td class="right">${p.stock}</td><td class="right">${p.onOrder}</td><td class="right">${money(p.price)}</td><td class="right"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn btn-ghost btn-sm" data-order="${p.id}">Order 5</button>${p.onOrder ? `<button class="btn btn-sm" data-receive="${p.id}">Receive</button>` : ""}</div></td></tr>`))}</section>
    <section class="card"><h2>Add Part</h2><form id="add" class="stack" style="gap:12px;margin-top:12px" novalidate>${field("Name", `<input name="name" required>`)}${field("SKU", `<input name="sku" required>`)}<div class="form-grid">${field("Stock", `<input name="stock" type="number" min="0" required>`)}${field("Reorder at", `<input name="reorder" type="number" min="0" required>`)}${field("Cost", `<input name="cost" type="number" min="0" step="0.01" required>`)}${field("Price", `<input name="price" type="number" min="0" step="0.01" required>`)}</div><p class="error" id="err" role="alert"></p><button class="btn">Add</button></form></section></div>`);
  const part = b => by(db().parts, "id", Number(b.dataset.order || b.dataset.receive));
  root.querySelectorAll("[data-order]").forEach(b => b.onclick = () => { part(b).onOrder += 5; commit("Order placed."); });
  root.querySelectorAll("[data-receive]").forEach(b => b.onclick = () => { const p = part(b); p.stock += p.onOrder; p.onOrder = 0; commit("Parts received."); });
  document.getElementById("add").onsubmit = ev => { ev.preventDefault(); const f = ev.target, name = f.name.value.trim(), sku = f.sku.value.trim(); if (!name || !sku || [f.stock, f.reorder, f.cost, f.price].some(i => i.value === "" || Number(i.value) < 0)) return document.getElementById("err").textContent = "Fill in every field."; db().parts.push({ id: PA.nextId(db().parts), name, sku, stock: Number(f.stock.value), reorder: Number(f.reorder.value), cost: Number(f.cost.value), price: Number(f.price.value), onOrder: 0 }); commit("Part added."); };
}
function services() {
  shell("services", "Services", "The menu customers book from.", `<div class="grid"><section class="card">${table(["Service", ">Hours", "Price"], db().services.map(s => `<tr><td>${esc(s.name)}</td><td class="right">${s.hours}</td><td style="width:130px"><input type="number" min="0" step="0.01" value="${s.price}" aria-label="Price for ${esc(s.name)}" data-price="${s.id}"></td></tr>`))}</section>
    <section class="card"><h2>Add Service</h2><form id="add" class="stack" style="gap:12px;margin-top:12px" novalidate>${field("Name", `<input name="name" required>`)}<div class="form-grid">${field("Price", `<input name="price" type="number" min="0" step="0.01" required>`)}${field("Hours", `<input name="hours" type="number" min="0" step="0.25" required>`)}</div>${field("Included checks, comma separated", `<input name="checks">`)}<p class="error" id="err" role="alert"></p><button class="btn">Add</button></form></section></div>`);
  root.querySelectorAll("[data-price]").forEach(i => i.onchange = () => { const n = Number(i.value); if (i.value === "" || n < 0) return render(); by(db().services, "id", Number(i.dataset.price)).price = n; commit("Price updated."); });
  document.getElementById("add").onsubmit = ev => { ev.preventDefault(); const f = ev.target, name = f.name.value.trim(); if (!name || f.price.value === "" || f.hours.value === "") return document.getElementById("err").textContent = "Enter a name, price, and hours."; db().services.push({ id: PA.nextId(db().services), name, price: Number(f.price.value), hours: Number(f.hours.value), checks: f.checks.value.split(",").map(s => s.trim()).filter(Boolean) }); commit("Service added."); };
}
function transactions() {
  const list = [...db().transactions].sort((a, b) => b.date.localeCompare(a.date));
  shell("transactions", "Transactions", "Invoices and payments.", `<section class="card">${table(["ID", "Date", "RO", "Customer", "Method", "Status", ">Amount", ""], list.map(t => { const r = by(db().repairs, "id", t.repairId); return `<tr><td>#${t.id}</td><td>${PA.shortDate(t.date)}</td><td><a class="link" href="#repair/${r.id}">#${r.id}</a></td><td>${esc(PA.customerName(cust(r)))}</td><td>${esc(t.method || "-")}</td><td><span class="tag tag-${t.status === "Paid" ? "green" : "amber"}">${esc(t.status)}</span></td><td class="right">${money(PA.totals(r).total)}</td><td class="right"><button class="btn btn-ghost btn-sm" data-inv="${r.id}">Invoice</button></td></tr>`; }))}</section>`);
  root.querySelectorAll("[data-inv]").forEach(b => b.onclick = () => PA.showInvoice(by(db().repairs, "id", Number(b.dataset.inv))));
}
function settings() {
  const s = db().settings;
  shell("settings", "Settings", "Shop details shown to customers and on invoices.", `<div class="grid-even"><section class="card"><form id="f" class="stack" style="gap:12px" novalidate>${field("Shop name", `<input name="shopName" value="${esc(s.shopName)}" required>`)}${field("Phone", `<input name="phone" value="${esc(s.phone)}" required>`)}${field("Address", `<input name="address" value="${esc(s.address)}" required>`)}${field("Hours", `<input name="hours" value="${esc(s.hours)}" required>`)}${field("Sales tax (%)", `<input name="taxRate" type="number" min="0" max="20" step="0.1" value="${s.taxRate}" required>`)}<p class="error" id="err" role="alert"></p><button class="btn">Save</button></form></section>
    <section class="card"><h2>Demo Data</h2><p class="muted" style="margin:8px 0 14px">Puts all sample customers, repairs, and parts back to the start.</p><button class="btn btn-danger" id="reset">Reset Demo Data</button></section></div>`);
  document.getElementById("f").onsubmit = ev => { ev.preventDefault(); const f = ev.target, vals = ["shopName", "phone", "address", "hours"].map(k => f[k].value.trim()); if (vals.some(v => !v) || f.taxRate.value === "") return document.getElementById("err").textContent = "Fill in every field."; Object.assign(s, { shopName: vals[0], phone: vals[1], address: vals[2], hours: vals[3], taxRate: Number(f.taxRate.value) }); commit("Settings saved."); };
  document.getElementById("reset").onclick = () => { if (confirm("Reset all demo data?")) { PA.reset(); location.hash = "#overview"; render(); toast("Demo data reset."); } };
}

const routes = { overview, repairs, customers, vehicles, employees, parts, services, transactions, settings };
function render() {
  const [route, id] = location.hash.slice(1).split("/");
  if (route === "repair") repairDetail(Number(id));
  else (routes[route] || overview)();
}
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
// New customer requests and approvals appear without a refresh, unless the owner is typing.
window.addEventListener("storage", () => { PA.load(); const el = document.activeElement; if (!el || !el.matches("input, textarea, select")) render(); });
render();
