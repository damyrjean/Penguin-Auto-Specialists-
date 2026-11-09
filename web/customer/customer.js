// Customer website. Each HTML file sets data-page and this file draws that page.
const { esc, money, by, icons } = PA;
const page = document.body.dataset.page;
const root = document.getElementById("root");
const params = new URLSearchParams(location.search);
const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];
const STEPS = ["Requested", "Scheduled", "In Progress", "Ready", "Completed"];
const TIMES = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"];

const me = () => by(PA.db.customers, "id", PA.db.session.customerId);
const myVehicles = () => PA.db.vehicles.filter(v => v.customerId === me().id);
const primary = () => myVehicles().find(v => v.primary) || myVehicles()[0];
const myRepairs = () => PA.db.repairs.filter(r => r.customerId === me().id);
const tech = r => by(PA.db.employees, "id", r.techId)?.name || "To be assigned";
const vehicle = r => by(PA.db.vehicles, "vin", r.vin);
const serviceNames = r => r.services.map(id => by(PA.db.services, "id", id)?.name).filter(Boolean).join(", ") || "Service request";
const byDate = (a, b) => a.date.localeCompare(b.date);
const upcoming = () => myRepairs().filter(r => ["Requested", "Scheduled"].includes(r.status)).sort(byDate);
const active = () => myRepairs().filter(r => ["In Progress", "Ready"].includes(r.status)).sort(byDate);
const nextService = v => { const m = (Math.floor(v.odometer / 5000) + 1) * 5000; return { mile: m, left: m - v.odometer }; };
const miles = n => Number(n).toLocaleString("en-US") + " mi";
const mapsUrl = () => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(PA.db.settings.address);
const telUrl = () => "tel:" + PA.db.settings.phone.replace(/\D/g, "");

function toast(text) {
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
  document.body.append(t); setTimeout(() => t.remove(), 3000);
}

function shell(title, sub, body) {
  const v = primary();
  const pending = myRepairs().some(r => r.approvals.some(a => a.status === "pending"));
  const links = [["dashboard", "index.html", "home", "Dashboard"], ["repair", "repair.html", "wrench", "My Repair"], ["book", "book.html", "calendar", "Book Appointment"], ["history", "history.html", "clock", "Service History"], ["vehicle", "vehicle.html", "truck", "Vehicle Profile"]];
  root.innerHTML = `<div class="app"><aside class="sidebar">
    <div class="brand"><div class="brand-logo">${icons.truck}</div><div><div class="brand-name">Penguin Auto</div><div class="brand-sub">Specialists</div></div></div>
    ${v ? `<div class="vehicle-chip"><div class="vehicle-chip-top">${icons.truck}<div><div class="vehicle-chip-name">${esc(PA.vehicleName(v))}</div><div class="vehicle-chip-trim">${esc(v.plate)}</div></div></div>
      <div class="vehicle-chip-bottom"><span>Odometer: ${miles(v.odometer)}</span><span class="tag tag-dark">PRIMARY</span></div></div>` : ""}
    <nav class="nav" aria-label="Main">${links.map(([p, href, icon, label]) => `<a href="${href}" class="nav-item ${p === page ? "active" : ""}" ${p === page ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
    <div class="user"><div class="user-avatar">${icons.user}</div><div><div class="user-name">${esc(PA.customerName(me()))}</div><div class="user-id">Client ID: #${me().id}</div></div></div>
    <a class="switch-link" href="../owner/">Switch to owner view</a>
  </aside><main class="main"><header class="page-header"><div><h1>${esc(title)}</h1><p class="muted">${sub}</p></div>
    ${pending ? `<div class="header-actions"><a class="status-pill" style="color:#92400e;border-color:#d97706;background:#fffbeb" href="repair.html">Approval needed</a></div>` : ""}</header>${body}</main></div>`;
}

function dashboard() {
  const v = primary(), up = upcoming()[0], act = active()[0];
  const waiting = myRepairs().find(r => r.approvals.some(a => a.status === "pending"));
  let main = `<section class="card"><p class="muted">Add your vehicle to get started.</p><br><a class="btn" href="vehicle.html">Add a Vehicle</a></section>`;
  if (v) {
    const n = nextService(v);
    main = `<section class="card"><div class="card-head"><div><h2>Active Vehicle</h2><p class="muted">Primary vehicle connected to your account</p></div><span class="tag tag-blue">Primary</span></div>
      <div class="vehicle"><div class="vehicle-img">${icons.truck}</div><div><div class="vehicle-name">${esc(PA.vehicleName(v))}</div><div class="muted">${esc(v.trim)}</div>
      <div class="vehicle-meta"><span>Odometer: <b>${miles(v.odometer)}</b></span><span>Plate: <b>${esc(v.plate)}</b></span></div></div></div></section>
      <section class="alert alert-blue"><div class="alert-icon">${icons.wrench}</div><div><div class="alert-title">Next service due</div><div class="alert-text">${n.mile.toLocaleString("en-US")} mile service, due in ${miles(n.left)}.</div></div></section>`;
  }
  const notice = waiting ? `<a class="alert alert-amber" href="repair.html?id=${waiting.id}"><div class="alert-icon">${icons.wrench}</div><div><div class="alert-title">Your approval is needed</div><div class="alert-text">RO #${waiting.id}: the shop found something on your ${esc(PA.vehicleName(vehicle(waiting)))}. Tap to review the photo.</div></div></a>`
    : act ? `<a class="alert alert-blue" href="repair.html?id=${act.id}"><div class="alert-icon">${icons.wrench}</div><div><div class="alert-title">${esc(act.status)}</div><div class="alert-text">RO #${act.id}, ${esc(PA.vehicleName(vehicle(act)))}. Tap to track it.</div></div></a>` : "";
  const side = up ? (() => {
    const checks = up.services.flatMap(id => by(PA.db.services, "id", id)?.checks || []);
    return `<section class="card upcoming"><div class="card-head"><span class="eyebrow">Upcoming Service</span><span class="tag tag-blue">${PA.relative(up.date)}</span></div>
      <h2 class="upcoming-title">${esc(serviceNames(up))}</h2>
      <div class="upcoming-line">${icons.calendar}<span>${PA.date(up.date)}, ${esc(up.time)}</span></div>
      <div class="upcoming-line">${icons.truck}<span>${esc(PA.vehicleName(vehicle(up)))}</span></div>
      <div class="upcoming-line">${icons.user}<span>Technician: ${esc(tech(up))}</span></div>
      ${checks.length ? `<hr><div class="checks-title">Included Checks:</div><ul class="checks">${checks.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
      <hr><div class="upcoming-foot"><div><div class="small muted">Estimate before tax</div><div class="price">${money(PA.totals(up).subtotal)}</div></div><a href="book.html?edit=${up.id}" class="btn">Manage Booking</a></div></section>`;
  })() : `<section class="card upcoming"><span class="eyebrow">Upcoming Service</span><p class="muted" style="margin:10px 0 14px">Nothing booked right now.</p><a class="btn" href="book.html">Book a Service</a></section>`;
  shell("Dashboard", `Welcome back, ${esc(me().first)}! Here is what is happening with your vehicles.`, `<div class="grid"><div class="col">${notice}${main}
    <section><h3 class="section-title">Quick Actions</h3><div class="actions">
      <a href="book.html" class="action"><span class="action-icon">${icons.wrench}</span>Book New Service</a>
      <a href="${telUrl()}" class="action"><span class="action-icon">${icons.phone}</span>Call the Shop</a>
      <a href="${mapsUrl()}" target="_blank" rel="noopener" class="action"><span class="action-icon">${icons.pin}</span>Get Directions</a>
    </div></section></div>${side}</div>`);
}

function timeline(r) {
  const at = STEPS.indexOf(r.status);
  return `<ol class="timeline">${STEPS.map((s, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}" ${i === at ? 'aria-current="step"' : ""}><div class="dot">${i <= at ? icons.check : ""}</div>${s}</li>`).join("")}</ol>`;
}

function repair() {
  const open = myRepairs().filter(r => OPEN.includes(r.status)).sort(byDate);
  const r = by(open, "id", Number(params.get("id"))) || active()[0] || open[0];
  if (!r) return shell("My Repair", "Live status of your repair.", `<section class="card"><p class="muted">You have no open repairs.</p><br><a class="btn" href="book.html">Book a Service</a></section>`);
  const t = PA.totals(r), v = vehicle(r);
  const others = open.filter(x => x.id !== r.id);
  const approvals = r.approvals.map(a => `<div class="approval"><img src="${esc(a.photo)}" alt="Technician photo: ${esc(a.title)}">
    <div class="approval-body"><div class="row between"><b>${esc(a.title)}</b><span class="price">${money(a.price)}</span></div><p class="muted">${esc(a.note)}</p>
    ${a.status === "pending" ? `<div class="row" style="margin-top:auto"><button class="btn" data-approve="${a.id}">Approve</button><button class="btn btn-ghost" data-decline="${a.id}">Decline</button></div>`
      : `<div style="margin-top:auto"><span class="tag tag-${a.status === "approved" ? "green" : "red"}">${a.status === "approved" ? "Approved" : "Declined"}</span></div>`}</div></div>`).join("");
  shell(`Repair Order #${r.id}`, `${esc(PA.vehicleName(v))}, ${esc(v.plate)}`, `<div class="stack">
    ${others.length ? `<div class="row"><span class="muted">Other open orders:</span>${others.map(o => `<a class="link" href="repair.html?id=${o.id}">RO #${o.id}</a>`).join("")}</div>` : ""}
    <section class="card"><div class="card-head"><h2>Status</h2>${PA.statusTag(r.status)}</div>${timeline(r)}</section>
    ${r.approvals.length ? `<section class="card stack"><div><h2>Photos and Approvals</h2><p class="muted">No extra work starts until you approve it.</p></div>${approvals}</section>` : ""}
    <section class="card"><div class="card-head"><div><h2>Current Estimate</h2><p class="muted">Technician: ${esc(tech(r))}</p></div></div>
      ${t.items.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th class="right">Amount</th></tr></thead><tbody>${t.items.map(l => `<tr><td>${esc(l.label)}${l.qty > 1 ? ` x ${l.qty}` : ""}</td><td class="right">${money(l.amount)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">The shop will add line items after inspection.</p>`}
      <div class="totals"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Tax</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div></section></div>`);
  const decide = (id, status) => { by(r.approvals, "id", id).status = status; PA.save(); toast(status === "approved" ? "Approved. The shop has been notified." : "Declined. The shop has been notified."); repair(); };
  root.querySelectorAll("[data-approve]").forEach(b => b.onclick = () => decide(Number(b.dataset.approve), "approved"));
  root.querySelectorAll("[data-decline]").forEach(b => b.onclick = () => decide(Number(b.dataset.decline), "declined"));
}

function book() {
  const editing = by(myRepairs().filter(r => ["Requested", "Scheduled"].includes(r.status)), "id", Number(params.get("edit")));
  const vs = myVehicles();
  if (!vs.length) return shell("Book Appointment", "Request a time for your vehicle.", `<section class="card"><p class="muted">Add a vehicle before booking.</p><br><a class="btn" href="vehicle.html">Add a Vehicle</a></section>`);
  const chosen = editing?.services || [];
  shell(editing ? `Manage Booking, RO #${editing.id}` : "Book Appointment", "The shop confirms your request and assigns a technician.", `<form id="f" class="grid" novalidate><div class="col">
    <section class="card stack"><h2>Vehicle and Time</h2><div class="form-grid">
      <label class="field span-2">Vehicle<select name="vin">${vs.map(v => `<option value="${esc(v.vin)}" ${(editing ? editing.vin === v.vin : v.primary) ? "selected" : ""}>${esc(PA.vehicleName(v))}, ${esc(v.plate)}</option>`).join("")}</select></label>
      <label class="field">Date<input type="date" name="date" min="${PA.iso(1)}" value="${editing?.date || ""}" required></label>
      <label class="field">Time<select name="time">${TIMES.map(t => `<option ${editing?.time === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="field span-2">What is going on? (optional)<textarea name="concern" rows="3">${esc(editing?.concern || "")}</textarea></label></div></section>
    <section class="card stack"><h2>Services</h2>${PA.db.services.map(s => `<label class="option"><input type="checkbox" name="service" value="${s.id}" ${chosen.includes(s.id) ? "checked" : ""}><span><b>${esc(s.name)}</b>${esc(s.checks.join(", "))}</span><span class="price-sm">${money(s.price)}</span></label>`).join("")}</section></div>
    <section class="card upcoming"><h2>Summary</h2><p class="muted" id="summary" style="margin:10px 0"></p><div class="price" id="total"></div><p class="small muted" style="margin:4px 0 12px">Estimate before tax. Shop hours: ${esc(PA.db.settings.hours)}.</p>
      <p class="error" id="err" role="alert"></p><div class="stack" style="gap:8px;margin-top:8px"><button class="btn">${editing ? "Save Changes" : "Request Appointment"}</button>${editing ? `<button type="button" class="btn btn-danger" id="cancel">Cancel This Appointment</button>` : ""}</div></section></form>`);
  const f = document.getElementById("f");
  const picked = () => [...f.querySelectorAll("[name=service]:checked")].map(c => Number(c.value));
  const update = () => { const list = picked().map(id => by(PA.db.services, "id", id)); document.getElementById("summary").textContent = list.length ? list.map(s => s.name).join(", ") : "Choose at least one service, or describe the problem."; document.getElementById("total").textContent = money(list.reduce((n, s) => n + s.price, 0)); };
  f.onchange = update; update();
  if (editing) document.getElementById("cancel").onclick = () => { if (confirm("Cancel this appointment?")) { editing.status = "Cancelled"; PA.save(); location.href = "index.html"; } };
  f.onsubmit = e => {
    e.preventDefault();
    const err = document.getElementById("err"), d = f.date.value, concern = f.concern.value.trim();
    if (!d) return err.textContent = "Pick a date.";
    if (d < PA.iso(1)) return err.textContent = "Pick a date after today.";
    if (new Date(d + "T12:00").getDay() === 0) return err.textContent = "The shop is closed on Sundays.";
    if (!picked().length && !concern) return err.textContent = "Choose a service or describe the problem.";
    const values = { vin: f.vin.value, date: d, time: f.time.value, concern, services: picked() };
    if (editing) Object.assign(editing, values);
    else PA.db.repairs.push({ id: PA.nextId(PA.db.repairs), customerId: me().id, status: "Requested", techId: null, parts: [], approvals: [], ...values });
    PA.save();
    const saved = editing ? "Your changes were saved." : "Request sent. It now shows on the shop's dashboard.";
    shell("Request Received", saved, `<section class="card"><p>${PA.date(d)}, ${esc(f.time.value)}</p><br><a class="btn" href="index.html">Back to Dashboard</a></section>`);
  };
}

function history() {
  const done = myRepairs().filter(r => r.status === "Completed").sort((a, b) => b.date.localeCompare(a.date));
  shell("Service History", "Past visits and invoices for all your vehicles.", `<section class="card">${done.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>RO</th><th>Vehicle</th><th>Service</th><th class="right">Total</th><th></th></tr></thead><tbody>
    ${done.map(r => `<tr><td>${PA.shortDate(r.date)}</td><td>#${r.id}</td><td>${esc(PA.vehicleName(vehicle(r)))}</td><td>${esc(serviceNames(r))}</td><td class="right">${money(PA.totals(r).total)}</td><td class="right"><button class="btn btn-ghost btn-sm" data-inv="${r.id}">Invoice</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">No completed visits yet.</p>`}</section>`);
  root.querySelectorAll("[data-inv]").forEach(b => b.onclick = () => PA.showInvoice(by(PA.db.repairs, "id", Number(b.dataset.inv))));
}

function vehiclePage() {
  const card = v => {
    const n = nextService(v), visits = myRepairs().filter(r => r.vin === v.vin && r.status === "Completed").length;
    return `<section class="card"><div class="card-head"><div><h2>${esc(PA.vehicleName(v))}</h2><p class="muted">${esc(v.trim)}</p></div>${v.primary ? `<span class="tag tag-blue">Primary</span>` : `<button class="btn btn-ghost btn-sm" data-primary="${esc(v.vin)}">Make Primary</button>`}</div>
      <div class="vehicle-meta"><span>VIN: <b>${esc(v.vin)}</b></span><span>Plate: <b>${esc(v.plate)}</b></span><span>Visits: <b>${visits}</b></span><span>Next service: <b>${n.mile.toLocaleString("en-US")} mi</b></span></div>
      <hr><form class="row" data-odo="${esc(v.vin)}"><label class="field" style="flex:1;min-width:160px">Odometer (mi)<input type="number" min="${v.odometer}" name="odo" value="${v.odometer}" required></label><button class="btn btn-ghost" style="align-self:flex-end">Update</button></form></section>`;
  };
  shell("Vehicle Profile", "Your vehicles on file with the shop.", `<div class="grid"><div class="col">${myVehicles().map(card).join("") || `<section class="card"><p class="muted">No vehicles yet.</p></section>`}</div>
    <section class="card"><h2>Add a Vehicle</h2><form id="add" class="stack" style="margin-top:12px;gap:12px" novalidate>
      <label class="field">VIN<input name="vin" maxlength="17" style="text-transform:uppercase" required></label>
      <div class="form-grid"><label class="field">Year<input name="year" type="number" min="1980" max="${new Date().getFullYear() + 1}" required></label><label class="field">Make<input name="make" required></label><label class="field">Model<input name="model" required></label><label class="field">Plate<input name="plate"></label></div>
      <label class="field">Odometer (mi)<input name="odometer" type="number" min="0" required></label><p class="error" id="err" role="alert"></p><button class="btn">Add Vehicle</button></form></section></div>`);
  root.querySelectorAll("[data-primary]").forEach(b => b.onclick = () => { myVehicles().forEach(v => v.primary = v.vin === b.dataset.primary); PA.save(); vehiclePage(); });
  root.querySelectorAll("[data-odo]").forEach(f => f.onsubmit = e => { e.preventDefault(); const v = by(PA.db.vehicles, "vin", f.dataset.odo), n = Number(f.odo.value); if (!n || n < v.odometer) return toast("Mileage can't go down."); v.odometer = n; PA.save(); vehiclePage(); toast("Mileage updated."); });
  const add = document.getElementById("add");
  add.onsubmit = e => {
    e.preventDefault();
    const err = document.getElementById("err"), vin = add.vin.value.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return err.textContent = "A VIN has 17 letters and numbers, with no I, O, or Q.";
    if (by(PA.db.vehicles, "vin", vin)) return err.textContent = "That VIN is already on file.";
    const year = Number(add.year.value);
    if (year < 1980 || year > new Date().getFullYear() + 1) return err.textContent = "Enter a valid year.";
    if (!add.make.value.trim() || !add.model.value.trim()) return err.textContent = "Enter the make and model.";
    if (add.odometer.value === "" || Number(add.odometer.value) < 0) return err.textContent = "Enter the mileage.";
    PA.db.vehicles.push({ vin, customerId: me().id, year, make: add.make.value.trim(), model: add.model.value.trim(), trim: "", plate: add.plate.value.trim() || "Not provided", odometer: Number(add.odometer.value), primary: !myVehicles().length });
    PA.save(); vehiclePage(); toast("Vehicle added.");
  };
}

function register() {
  root.innerHTML = `<main class="center-page"><section class="card"><h1>Create Your Account</h1><p class="muted">Penguin Auto Specialists</p><form id="f" class="stack" style="margin-top:16px;gap:12px" novalidate>
    <div class="form-grid"><label class="field">First name<input name="first" autocomplete="given-name" required></label><label class="field">Last name<input name="last" autocomplete="family-name" required></label></div>
    <label class="field">Phone<input name="phone" type="tel" autocomplete="tel" required></label><label class="field">Email<input name="email" type="email" autocomplete="email" required></label>
    <p class="error" id="err" role="alert"></p><button class="btn">Create Account</button></form></section></main>`;
  const f = document.getElementById("f");
  f.onsubmit = e => {
    e.preventDefault();
    const [first, last, phone, email] = ["first", "last", "phone", "email"].map(n => f[n].value.trim());
    if (!first || !last) return document.getElementById("err").textContent = "Enter your name.";
    if (phone.replace(/\D/g, "").length < 10) return document.getElementById("err").textContent = "Enter a 10 digit phone number.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return document.getElementById("err").textContent = "Enter a valid email.";
    const id = PA.nextId(PA.db.customers);
    PA.db.customers.push({ id, first, last, phone, email });
    PA.db.session.customerId = id; PA.save();
    location.href = "vehicle.html";
  };
}

const pages = { dashboard, repair, book, history, vehicle: vehiclePage, register };
pages[page]();
// Picks up changes made in the owner view in another tab. Forms are left alone so typing isn't lost.
window.addEventListener("storage", () => { PA.load(); if (!["book", "register", "vehicle"].includes(page)) pages[page](); });
