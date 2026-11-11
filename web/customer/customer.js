// Customer website.
// Every customer HTML file has <body data-page="...">. This file reads that
// value and builds the matching page inside <div id="root">.
// Data comes from the API through PA.api (web/shared/api.js).

const page = document.body.dataset.page;
const root = document.getElementById("root");
const icons = PA.icons;
const esc = PA.esc;
const money = PA.money;

const STEPS = ["Requested", "Scheduled", "In Progress", "Ready", "Completed"];
const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

// Filled in by loadData() from the API
let data = { me: null, vehicles: [], repairs: [], services: [] };


// ---------- Load from the API ----------

async function loadData() {
  const results = await Promise.all([
    PA.api("GET", "/my/account", null, "customer"),
    PA.api("GET", "/my/vehicles", null, "customer"),
    PA.api("GET", "/my/repairs", null, "customer"),
    PA.api("GET", "/services")
  ]);
  data = { me: results[0], vehicles: results[1], repairs: results[2], services: results[3] };
}


// ---------- Lookups ----------

function me() {
  return data.me;
}

function myVehicles() {
  return data.vehicles;
}

// The first car added is the primary one
function primaryVehicle() {
  return data.vehicles[0];
}

function myRepairs() {
  return data.repairs;
}

function myOpenRepairs() {
  const list = myRepairs().filter(r => OPEN.includes(r.status));
  list.sort((a, b) => a.appt_date.localeCompare(b.appt_date));
  return list;
}

function techFor(repair) {
  return repair.technician_name || "Not assigned yet";
}

function serviceNames(repair) {
  if (repair.services.length === 0) return "Service request";
  return repair.services.map(s => s.name).join(", ");
}

function checksFor(service) {
  if (!service.checklist) return [];
  return service.checklist.split(",").map(c => {
    c = c.trim();
    return c.charAt(0).toUpperCase() + c.slice(1);
  });
}

function miles(n) {
  return (n || 0).toLocaleString();
}


// ---------- Page layout (sidebar + header) ----------

function drawPage(title, subtitle, content) {
  const links = [
    ["dashboard", "index.html", "home", "Dashboard"],
    ["repair", "repair.html", "wrench", "My Repair"],
    ["book", "book.html", "calendar", "Book Appointment"],
    ["history", "history.html", "clock", "Service History"],
    ["vehicle", "vehicle.html", "truck", "Vehicle Profile"]
  ];

  let nav = "";
  for (const link of links) {
    const activeClass = link[0] === page ? "active" : "";
    nav += `<a href="${link[1]}" class="nav-item ${activeClass}">${icons[link[2]]}<span>${link[3]}</span></a>`;
  }

  let vehicleChip = "";
  const vehicle = primaryVehicle();
  if (vehicle) {
    vehicleChip = `
      <div class="vehicle-chip">
        <div class="vehicle-chip-top">${icons.truck}
          <div>
            <div class="vehicle-chip-name">${esc(PA.vehicleName(vehicle))}</div>
            <div class="vehicle-chip-trim">${esc(vehicle.plate)}</div>
          </div>
        </div>
        <div class="vehicle-chip-bottom">
          <span>Odometer: ${miles(vehicle.odometer)} mi</span>
          <span class="tag tag-dark">PRIMARY</span>
        </div>
      </div>`;
  }

  root.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-logo">${icons.truck}</div>
          <div>
            <div class="brand-name">Penguin Auto</div>
            <div class="brand-sub">Specialists</div>
          </div>
        </div>
        ${vehicleChip}
        <nav class="nav">${nav}</nav>
        <div class="user">
          <div class="user-avatar">${icons.user}</div>
          <div>
            <div class="user-name">${esc(PA.customerName(me()))}</div>
            <div class="user-id">Client ID: #${me().id}</div>
          </div>
        </div>
        <a class="switch-link" href="#" onclick="logOut()">Log out</a>
      </aside>
      <main class="main">
        <header class="page-header">
          <div>
            <h1>${title}</h1>
            <p class="muted">${subtitle}</p>
          </div>
        </header>
        ${content}
      </main>
    </div>`;
}

function logOut() {
  PA.logout("customer");
  location.href = "login.html";
}


// ---------- Dashboard ----------

function dashboardPage() {
  const vehicle = primaryVehicle();
  const openRepairs = myOpenRepairs();
  const waiting = openRepairs.find(r => r.approvals.some(a => a.status === "pending"));
  const upcoming = openRepairs.find(r => r.status === "Requested" || r.status === "Scheduled");

  // Yellow box if the shop is waiting on the customer to approve work
  let alertBox = "";
  if (waiting) {
    alertBox = `
      <a class="alert alert-amber" href="repair.html?id=${waiting.id}">
        <div class="alert-icon">${icons.wrench}</div>
        <div>
          <div class="alert-title">Your approval is needed</div>
          <div class="alert-text">RO #${waiting.id}: the shop found extra work on your ${esc(waiting.vehicle_name)}. Click to review it.</div>
        </div>
      </a>`;
  }

  // Vehicle card and next service reminder
  let vehicleCard = `<section class="card"><p class="muted">You have no vehicles yet.</p><br><a class="btn" href="vehicle.html">Add a Vehicle</a></section>`;
  if (vehicle) {
    const odometer = vehicle.odometer || 0;
    const nextService = (Math.floor(odometer / 5000) + 1) * 5000;
    const milesLeft = nextService - odometer;
    vehicleCard = `
      <section class="card">
        <div class="card-head">
          <div>
            <h2>Active Vehicle</h2>
            <p class="muted">Primary vehicle on your account</p>
          </div>
          <span class="tag tag-blue">Primary</span>
        </div>
        <div class="vehicle">
          <div class="vehicle-img">${icons.truck}</div>
          <div>
            <div class="vehicle-name">${esc(PA.vehicleName(vehicle))}</div>
            <div class="vehicle-meta">
              <span>Odometer: <b>${miles(odometer)} mi</b></span>
              <span>Plate: <b>${esc(vehicle.plate)}</b></span>
            </div>
          </div>
        </div>
      </section>
      <section class="alert alert-blue">
        <div class="alert-icon">${icons.wrench}</div>
        <div>
          <div class="alert-title">Next service due</div>
          <div class="alert-text">${nextService.toLocaleString()} mile service, due in ${milesLeft.toLocaleString()} mi.</div>
        </div>
      </section>`;
  }

  // Upcoming appointment card
  let upcomingCard = `
    <section class="card upcoming">
      <span class="eyebrow">Upcoming Service</span>
      <p class="muted" style="margin:10px 0 14px">Nothing booked right now.</p>
      <a class="btn" href="book.html">Book a Service</a>
    </section>`;
  if (upcoming) {
    let checks = "";
    for (const s of upcoming.services) {
      const service = data.services.find(x => x.id === s.id);
      if (!service) continue;
      for (const check of checksFor(service)) {
        checks += `<li>${esc(check)}</li>`;
      }
    }
    upcomingCard = `
      <section class="card upcoming">
        <div class="card-head">
          <span class="eyebrow">Upcoming Service</span>
          <span class="tag tag-blue">${PA.relative(upcoming.appt_date)}</span>
        </div>
        <h2 class="upcoming-title">${esc(serviceNames(upcoming))}</h2>
        <div class="upcoming-line">${icons.calendar}<span>${PA.date(upcoming.appt_date)}, ${PA.time(upcoming.appt_time)}</span></div>
        <div class="upcoming-line">${icons.truck}<span>${esc(upcoming.vehicle_name)}</span></div>
        <div class="upcoming-line">${icons.user}<span>Technician: ${esc(techFor(upcoming))}</span></div>
        <hr>
        <div class="checks-title">Included Checks:</div>
        <ul class="checks">${checks}</ul>
        <hr>
        <div class="upcoming-foot">
          <div>
            <div class="small muted">Estimate before tax</div>
            <div class="price">${money(upcoming.subtotal)}</div>
          </div>
          <a href="repair.html?id=${upcoming.id}" class="btn">View Details</a>
        </div>
      </section>`;
  }

  const phone = PA.SHOP.phone.replace(/\D/g, "");
  const mapLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(PA.SHOP.address);

  drawPage("Dashboard", `Welcome back, ${esc(me().first_name)}!`, `
    <div class="grid">
      <div class="col">
        ${alertBox}
        ${vehicleCard}
        <section>
          <h3 class="section-title">Quick Actions</h3>
          <div class="actions">
            <a href="book.html" class="action"><span class="action-icon">${icons.wrench}</span>Book New Service</a>
            <a href="tel:${phone}" class="action"><span class="action-icon">${icons.phone}</span>Call the Shop</a>
            <a href="${mapLink}" target="_blank" class="action"><span class="action-icon">${icons.pin}</span>Get Directions</a>
          </div>
        </section>
      </div>
      ${upcomingCard}
    </div>`);
}


// ---------- My Repair (status and photo approvals) ----------

function repairPage() {
  const openRepairs = myOpenRepairs();
  const id = Number(new URLSearchParams(location.search).get("id"));
  let repair = openRepairs.find(r => r.id === id);
  if (!repair) repair = openRepairs[0];

  if (!repair) {
    drawPage("My Repair", "Live status of your repair.", `
      <section class="card"><p class="muted">You have no open repairs.</p><br><a class="btn" href="book.html">Book a Service</a></section>`);
    return;
  }

  // Links to the customer's other open repairs
  let otherLinks = "";
  for (const other of openRepairs) {
    if (other.id !== repair.id) {
      otherLinks += `<a class="link" href="repair.html?id=${other.id}">RO #${other.id}</a> `;
    }
  }

  // Status timeline
  const current = STEPS.indexOf(repair.status);
  let timeline = `<ol class="timeline">`;
  for (let i = 0; i < STEPS.length; i++) {
    let stepClass = "";
    if (i < current) stepClass = "done";
    if (i === current) stepClass = "now";
    const dot = i <= current ? icons.check : "";
    timeline += `<li class="${stepClass}"><div class="dot">${dot}</div>${STEPS[i]}</li>`;
  }
  timeline += `</ol>`;

  // Extra work the shop sent for approval
  let approvals = "";
  for (const a of repair.approvals) {
    let buttons = "";
    if (a.status === "pending") {
      buttons = `
        <div class="row">
          <button class="btn" onclick="decide(${a.id}, 'approved')">Approve</button>
          <button class="btn btn-ghost" onclick="decide(${a.id}, 'declined')">Decline</button>
        </div>`;
    } else if (a.status === "approved") {
      buttons = `<span class="tag tag-green">Approved</span>`;
    } else {
      buttons = `<span class="tag tag-red">Declined</span>`;
    }
    const photo = a.photo_url ? `<img src="${esc(a.photo_url)}" alt="Photo: ${esc(a.title)}">` : "";
    approvals += `
      <div class="approval">
        ${photo}
        <div class="approval-body">
          <div class="row between"><b>${esc(a.title)}</b><span class="price">${money(a.price)}</span></div>
          <p class="muted">${esc(a.note)}</p>
          <div>${buttons}</div>
        </div>
      </div>`;
  }
  if (approvals === "") approvals = `<p class="muted">The shop has not sent any photos.</p>`;

  // Estimate
  let rows = "";
  for (const item of PA.lineItems(repair)) {
    rows += `<tr><td>${esc(item.label)}</td><td class="right">${money(item.amount)}</td></tr>`;
  }

  drawPage(`Repair Order #${repair.id}`, `${esc(repair.vehicle_name)}, ${esc(repair.vehicle_plate)}`, `
    <div class="stack">
      ${otherLinks ? `<p class="muted">Other open orders: ${otherLinks}</p>` : ""}
      <section class="card">
        <div class="card-head"><h2>Status</h2>${PA.statusTag(repair.status)}</div>
        ${timeline}
      </section>
      <section class="card stack">
        <div>
          <h2>Photos and Approvals</h2>
          <p class="muted">No extra work starts until you approve it.</p>
        </div>
        ${approvals}
      </section>
      <section class="card">
        <h2>Current Estimate</h2>
        <p class="muted">Technician: ${esc(techFor(repair))}</p><br>
        <table class="table">
          <thead><tr><th>Item</th><th class="right">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${money(repair.subtotal)}</span></div>
          <div><span>Tax</span><span>${money(repair.tax)}</span></div>
          <div class="grand"><span>Total</span><span>${money(repair.total)}</span></div>
        </div>
      </section>
    </div>`);
}

async function decide(approvalId, choice) {
  try {
    await PA.api("PATCH", "/my/approvals/" + approvalId, { status: choice }, "customer");
    if (choice === "approved") alert("Approved. The shop will start the work.");
    else alert("Declined. The shop will not do this work.");
    await start();
  } catch (e) {
    alert(e.message);
  }
}


// ---------- Book Appointment ----------

function bookPage() {
  const vehicles = myVehicles();
  if (vehicles.length === 0) {
    drawPage("Book Appointment", "Request a time for your vehicle.", `
      <section class="card"><p class="muted">Add a vehicle before booking.</p><br><a class="btn" href="vehicle.html">Add a Vehicle</a></section>`);
    return;
  }

  let vehicleOptions = "";
  for (const v of vehicles) {
    vehicleOptions += `<option value="${v.id}">${esc(PA.vehicleName(v))}, ${esc(v.plate)}</option>`;
  }

  let timeOptions = "";
  for (const t of TIMES) {
    timeOptions += `<option>${t}</option>`;
  }

  let serviceBoxes = "";
  for (const s of data.services) {
    serviceBoxes += `
      <label class="option">
        <input type="checkbox" name="service" value="${s.id}" onchange="updateTotal()">
        <span><b>${esc(s.name)}</b>${esc(s.checklist)}</span>
        <span class="price-sm">${money(s.price)}</span>
      </label>`;
  }

  drawPage("Book Appointment", "The shop will confirm your request and assign a technician.", `
    <form class="grid" onsubmit="submitBooking(event)">
      <div class="col">
        <section class="card stack">
          <h2>Vehicle and Time</h2>
          <div class="form-grid">
            <label class="field span-2">Vehicle<select name="vehicle">${vehicleOptions}</select></label>
            <label class="field">Date<input type="date" name="date"></label>
            <label class="field">Time<select name="time">${timeOptions}</select></label>
            <label class="field span-2">What is going on? (optional)<textarea name="concern" rows="3"></textarea></label>
          </div>
        </section>
        <section class="card stack">
          <h2>Services</h2>
          ${serviceBoxes}
        </section>
      </div>
      <section class="card upcoming">
        <h2>Summary</h2>
        <p class="small muted" style="margin:10px 0 4px">Estimate before tax</p>
        <div class="price" id="total">$0.00</div>
        <p class="small muted" style="margin:4px 0 12px">Shop hours: ${esc(PA.SHOP.hours)}</p>
        <p class="error" id="error"></p>
        <button class="btn" style="width:100%">Request Appointment</button>
      </section>
    </form>`);
}

function checkedServices() {
  const ids = [];
  const boxes = document.querySelectorAll("[name=service]:checked");
  for (const box of boxes) {
    ids.push(Number(box.value));
  }
  return ids;
}

function updateTotal() {
  let total = 0;
  for (const id of checkedServices()) {
    total += data.services.find(s => s.id === id).price;
  }
  document.getElementById("total").textContent = money(total);
}

async function submitBooking(event) {
  event.preventDefault();
  const form = event.target;
  const error = document.getElementById("error");
  const services = checkedServices();
  const concern = form.concern.value.trim();

  if (form.date.value === "") {
    error.textContent = "Please pick a date.";
    return;
  }
  if (form.date.value <= PA.iso(0)) {
    error.textContent = "Please pick a date after today.";
    return;
  }
  if (services.length === 0 && concern === "") {
    error.textContent = "Please choose a service or describe the problem.";
    return;
  }

  try {
    await PA.api("POST", "/my/repairs", {
      vehicle_id: Number(form.vehicle.value),
      appt_date: form.date.value,
      appt_time: form.time.value,
      concern: concern,
      service_ids: services
    }, "customer");
    alert("Your request was sent. The shop will confirm it soon.");
    location.href = "index.html";
  } catch (e) {
    error.textContent = e.message;
  }
}


// ---------- Service History ----------

function historyPage() {
  const done = myRepairs().filter(r => r.status === "Completed");
  done.sort((a, b) => b.appt_date.localeCompare(a.appt_date));

  let rows = "";
  for (const r of done) {
    rows += `
      <tr>
        <td>${PA.shortDate(r.appt_date)}</td>
        <td>#${r.id}</td>
        <td>${esc(r.vehicle_name)}</td>
        <td>${esc(serviceNames(r))}</td>
        <td class="right">${money(r.total)}</td>
        <td class="right"><button class="btn btn-ghost btn-sm" onclick="showInvoice(${r.id})">Invoice</button></td>
      </tr>`;
  }

  let content = `<p class="muted">No completed visits yet.</p>`;
  if (rows !== "") {
    content = `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Date</th><th>RO</th><th>Vehicle</th><th>Service</th><th class="right">Total</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  drawPage("Service History", "Past visits and invoices.", `<section class="card">${content}</section>`);
}

function showInvoice(repairId) {
  PA.showInvoice(myRepairs().find(r => r.id === repairId));
}


// ---------- Vehicle Profile ----------

function vehiclePage() {
  let cards = "";
  for (const v of myVehicles()) {
    const visits = myRepairs().filter(r => r.vehicle_id === v.id && r.status === "Completed").length;
    cards += `
      <section class="card">
        <div class="card-head">
          <h2>${esc(PA.vehicleName(v))}</h2>
          ${v === primaryVehicle() ? `<span class="tag tag-blue">Primary</span>` : ""}
        </div>
        <div class="vehicle-meta">
          <span>VIN: <b>${esc(v.vin)}</b></span>
          <span>Plate: <b>${esc(v.plate)}</b></span>
          <span>Odometer: <b>${miles(v.odometer)} mi</b></span>
          <span>Visits: <b>${visits}</b></span>
        </div>
      </section>`;
  }
  if (cards === "") cards = `<section class="card"><p class="muted">No vehicles yet.</p></section>`;

  drawPage("Vehicle Profile", "Your vehicles on file with the shop.", `
    <div class="grid">
      <div class="col">${cards}</div>
      <section class="card">
        <h2>Add a Vehicle</h2>
        <form class="stack" style="margin-top:12px;gap:12px" onsubmit="addVehicle(event)">
          <label class="field">VIN<input name="vin" maxlength="17"></label>
          <div class="form-grid">
            <label class="field">Year<input name="year" type="number"></label>
            <label class="field">Make<input name="make"></label>
            <label class="field">Model<input name="model"></label>
            <label class="field">Plate<input name="plate"></label>
          </div>
          <label class="field">Odometer (mi)<input name="odometer" type="number"></label>
          <p class="error" id="error"></p>
          <button class="btn">Add Vehicle</button>
        </form>
      </section>
    </div>`);
}

async function addVehicle(event) {
  event.preventDefault();
  const form = event.target;
  const error = document.getElementById("error");
  const vin = form.vin.value.trim().toUpperCase();

  if (vin.length !== 17) {
    error.textContent = "A VIN must be 17 characters.";
    return;
  }
  if (form.year.value === "" || form.make.value.trim() === "" || form.model.value.trim() === "" || form.odometer.value === "") {
    error.textContent = "Please fill in the year, make, model, and odometer.";
    return;
  }

  try {
    await PA.api("POST", "/my/vehicles", {
      vin: vin,
      year: Number(form.year.value),
      make: form.make.value.trim(),
      model: form.model.value.trim(),
      plate: form.plate.value.trim() || "Not provided",
      odometer: Number(form.odometer.value)
    }, "customer");
    alert("Vehicle added.");
    await start();
  } catch (e) {
    error.textContent = e.message === "That already exists" ? "That VIN is already on file." : e.message;
  }
}


// ---------- Log In ----------

function loginPage() {
  root.innerHTML = `
    <main class="center-page">
      <section class="card">
        <h1>Log In</h1>
        <p class="muted">Penguin Auto Specialists</p>
        <form class="stack" style="margin-top:16px;gap:12px" onsubmit="logIn(event)">
          <label class="field">Email<input name="email" type="email"></label>
          <label class="field">Password<input name="password" type="password"></label>
          <p class="error" id="error"></p>
          <button class="btn">Log In</button>
        </form>
        <p class="muted" style="margin-top:14px">New here? <a class="link" href="register.html">Create an account</a></p>
      </section>
    </main>`;
}

async function logIn(event) {
  event.preventDefault();
  const form = event.target;
  try {
    const result = await PA.api("POST", "/login", {
      email: form.email.value.trim(),
      password: form.password.value
    });
    PA.setToken("customer", result.token);
    location.href = "index.html";
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
}


// ---------- Create Account ----------

function registerPage() {
  root.innerHTML = `
    <main class="center-page">
      <section class="card">
        <h1>Create Your Account</h1>
        <p class="muted">Penguin Auto Specialists</p>
        <form class="stack" style="margin-top:16px;gap:12px" onsubmit="createAccount(event)">
          <div class="form-grid">
            <label class="field">First name<input name="first"></label>
            <label class="field">Last name<input name="last"></label>
          </div>
          <label class="field">Phone<input name="phone" type="tel"></label>
          <label class="field">Email<input name="email" type="email"></label>
          <label class="field">Password<input name="password" type="password"></label>
          <p class="error" id="error"></p>
          <button class="btn">Create Account</button>
        </form>
        <p class="muted" style="margin-top:14px">Already have an account? <a class="link" href="login.html">Log in</a></p>
      </section>
    </main>`;
}

async function createAccount(event) {
  event.preventDefault();
  const form = event.target;
  const error = document.getElementById("error");
  const first = form.first.value.trim();
  const last = form.last.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (first === "" || last === "" || phone === "" || email === "" || password === "") {
    error.textContent = "Please fill in every field.";
    return;
  }
  if (!email.includes("@")) {
    error.textContent = "Please enter a valid email.";
    return;
  }
  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const result = await PA.api("POST", "/register", {
      first_name: first, last_name: last, phone: phone, email: email, password: password
    });
    PA.setToken("customer", result.token);
    // New customers add their vehicle next
    location.href = "vehicle.html";
  } catch (e) {
    error.textContent = e.message;
  }
}


// ---------- Pick which page to draw ----------

async function start() {
  if (page === "login") return loginPage();
  if (page === "register") return registerPage();

  // Every other page needs a login
  if (!PA.getToken("customer")) {
    location.href = "login.html";
    return;
  }

  try {
    await loadData();
  } catch (e) {
    PA.showMessage(e.message);
    return;
  }

  if (page === "dashboard") dashboardPage();
  else if (page === "repair") repairPage();
  else if (page === "book") bookPage();
  else if (page === "history") historyPage();
  else if (page === "vehicle") vehiclePage();
}

start();
