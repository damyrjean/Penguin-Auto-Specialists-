// Owner website.
// This is one HTML page. The part of the URL after # picks the section,
// for example #overview, #parts, or #repair/4.
// Data comes from the API through PA.api (web/shared/api.js).

const root = document.getElementById("root");
const icons = PA.icons;
const esc = PA.esc;
const money = PA.money;

const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];

// Filled in by loadData() from the API
let data = { repairs: [], customers: [], vehicles: [], employees: [], parts: [], services: [], transactions: [] };


// ---------- Load from the API ----------

// Shortcut for owner API calls
function ownerApi(method, path, body) {
  return PA.api(method, "/owner" + path, body, "owner");
}

async function loadData() {
  const names = ["repairs", "customers", "vehicles", "employees", "parts", "services", "transactions"];
  const results = await Promise.all(names.map(name => ownerApi("GET", "/" + name)));
  names.forEach((name, i) => data[name] = results[i]);
}


// ---------- Lookups ----------

function findRepair(id) {
  return data.repairs.find(r => r.id === id);
}

function techName(repair) {
  return repair.technician_name || "Unassigned";
}


// ---------- Owner login ----------

function loginPage() {
  root.innerHTML = `
    <main class="center-page">
      <section class="card">
        <h1>Owner Log In</h1>
        <p class="muted">Penguin Auto Specialists</p>
        <form class="stack" style="margin-top:16px;gap:12px" onsubmit="logIn(event)">
          <label class="field">Password<input name="password" type="password"></label>
          <p class="error" id="error"></p>
          <button class="btn">Log In</button>
        </form>
      </section>
    </main>`;
}

async function logIn(event) {
  event.preventDefault();
  try {
    const result = await PA.api("POST", "/owner/login", { password: event.target.password.value });
    PA.setToken("owner", result.token);
    showPage();
  } catch (e) {
    document.getElementById("error").textContent = e.message;
  }
}

function logOut() {
  PA.logout("owner");
  loginPage();
}


// ---------- Page layout (sidebar + header) ----------

function drawPage(active, title, subtitle, content) {
  const links = [
    ["overview", "home", "Overview"],
    ["repairs", "wrench", "Repairs"],
    ["customers", "users", "Customers"],
    ["vehicles", "truck", "Vehicles"],
    ["employees", "user", "Employees"],
    ["parts", "box", "Parts"],
    ["services", "list", "Services"],
    ["transactions", "card", "Transactions"],
    ["settings", "gear", "Settings"]
  ];

  let nav = "";
  for (const link of links) {
    const activeClass = link[0] === active ? "active" : "";
    nav += `<a href="#${link[0]}" class="nav-item ${activeClass}">${icons[link[1]]}<span>${link[2]}</span></a>`;
  }

  root.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-logo">${icons.truck}</div>
          <div>
            <div class="brand-name">Penguin Auto</div>
            <div class="brand-sub">Owner Dashboard</div>
          </div>
        </div>
        <nav class="nav">${nav}</nav>
        <div class="user">
          <div class="user-avatar">${icons.user}</div>
          <div>
            <div class="user-name">Shop Owner</div>
            <div class="user-id">Administrator</div>
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

// Builds a table. Headers that start with ">" are right aligned.
function makeTable(headers, rows, emptyText) {
  if (rows === "") return `<p class="muted">${emptyText}</p>`;

  let head = "";
  for (const h of headers) {
    if (h.startsWith(">")) head += `<th class="right">${h.slice(1)}</th>`;
    else head += `<th>${h}</th>`;
  }
  return `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function repairRows(list) {
  let rows = "";
  for (const r of list) {
    const waiting = r.waiting_approval ? ` <span class="tag tag-amber">Awaiting customer</span>` : "";
    rows += `
      <tr>
        <td><a class="link" href="#repair/${r.id}">#${r.id}</a></td>
        <td>${esc(r.customer_name)}</td>
        <td>${esc(r.vehicle_name)}</td>
        <td>${PA.shortDate(r.appt_date)}, ${PA.time(r.appt_time)}</td>
        <td>${esc(techName(r))}</td>
        <td>${PA.statusTag(r.status)}${waiting}</td>
      </tr>`;
  }
  return rows;
}

const REPAIR_HEADERS = ["RO", "Customer", "Vehicle", "Date", "Technician", "Status"];

// Runs an API call, shows any error, then reloads the page
async function save(apiCall, message) {
  try {
    await apiCall;
    if (message) alert(message);
  } catch (e) {
    alert(e.message);
  }
  showPage();
}


// ---------- Overview ----------

function overviewPage() {
  const open = data.repairs.filter(r => OPEN.includes(r.status));
  open.sort((a, b) => a.appt_date.localeCompare(b.appt_date));
  const requests = open.filter(r => r.status === "Requested");
  const lowStock = data.parts.filter(p => p.stock <= p.reorder);

  let requestRows = "";
  for (const r of requests) {
    requestRows += `
      <tr>
        <td><a class="link" href="#repair/${r.id}">#${r.id}</a></td>
        <td>${esc(r.customer_name)}</td>
        <td>${esc(r.vehicle_name)}</td>
        <td>${PA.shortDate(r.appt_date)}, ${PA.time(r.appt_time)}</td>
        <td class="right"><button class="btn btn-sm" onclick="acceptRequest(${r.id})">Accept</button></td>
      </tr>`;
  }

  drawPage("overview", "Overview", "Everything happening in the shop.", `
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <a class="card" href="#repairs"><div class="muted">Open repairs</div><div class="stat-value">${open.length}</div></a>
      <a class="card" href="#repairs"><div class="muted">New requests</div><div class="stat-value">${requests.length}</div></a>
      <a class="card" href="#parts"><div class="muted">Low stock parts</div><div class="stat-value">${lowStock.length}</div></a>
    </div>
    <div class="stack">
      <section class="card">
        <h2>New Appointment Requests</h2><br>
        ${makeTable(["RO", "Customer", "Vehicle", "Requested for", ""], requestRows, "No new requests.")}
      </section>
      <section class="card">
        <h2>Open Repairs</h2><br>
        ${makeTable(REPAIR_HEADERS, repairRows(open), "No open repairs.")}
      </section>
    </div>`);
}

function acceptRequest(id) {
  save(ownerApi("PATCH", "/repairs/" + id, { status: "Scheduled" }));
}


// ---------- Repairs list ----------

function repairsPage() {
  drawPage("repairs", "Repairs", "Every repair order, newest first.", `
    <section class="card">${makeTable(REPAIR_HEADERS, repairRows(data.repairs), "No repairs yet.")}</section>`);
}


// ---------- One repair order ----------

async function repairDetailPage(id) {
  let r;
  try {
    r = await ownerApi("GET", "/repairs/" + id);
  } catch (e) {
    drawPage("repairs", "Repair not found", `<a class="link" href="#repairs">Back to repairs</a>`, "");
    return;
  }

  const invoice = data.transactions.find(t => t.repair_id === r.id);
  const finished = r.status === "Completed" || r.status === "Cancelled";
  const pending = r.approvals.some(a => a.status === "pending");

  // Status and technician
  let statusBox = PA.statusTag(r.status);
  let techBox = esc(techName(r));
  if (!finished) {
    let statusOptions = "";
    for (const s of [...OPEN, "Cancelled"]) {
      statusOptions += `<option ${s === r.status ? "selected" : ""}>${s}</option>`;
    }
    statusBox = `<select onchange="changeStatus(${r.id}, this.value)">${statusOptions}</select>`;

    let techOptions = `<option value="">Unassigned</option>`;
    for (const e of data.employees) {
      if (e.role === "Service Advisor" || !e.active) continue;
      techOptions += `<option value="${e.id}" ${e.id === r.technician_id ? "selected" : ""}>${esc(e.name)}</option>`;
    }
    techBox = `<select onchange="changeTech(${r.id}, this.value)">${techOptions}</select>`;
  }

  // Line items
  let itemRows = "";
  for (const item of PA.lineItems(r)) {
    itemRows += `<tr><td>${esc(item.label)}${item.qty > 1 ? " x " + item.qty : ""}</td><td class="right">${money(item.amount)}</td></tr>`;
  }

  let addForms = "";
  if (!finished) {
    let serviceOptions = "";
    for (const s of data.services) {
      serviceOptions += `<option value="${s.id}">${esc(s.name)}</option>`;
    }
    let partOptions = "";
    for (const p of data.parts) {
      partOptions += `<option value="${p.id}">${esc(p.name)} (${p.stock} left)</option>`;
    }
    addForms = `
      <div class="form-grid">
        <label class="field">Add service<select id="new-service">${serviceOptions}</select></label>
        <label class="field">Add part<select id="new-part">${partOptions}</select></label>
        <button class="btn btn-ghost" onclick="addService(${r.id})">Add Service</button>
        <button class="btn btn-ghost" onclick="addPart(${r.id})">Add Part</button>
      </div>`;
  }

  // Approvals sent to the customer
  let approvals = "";
  for (const a of r.approvals) {
    let tag = `<span class="tag tag-amber">Waiting on customer</span>`;
    if (a.status === "approved") tag = `<span class="tag tag-green">Approved</span>`;
    if (a.status === "declined") tag = `<span class="tag tag-red">Declined</span>`;
    const photo = a.photo_url ? `<img src="${esc(a.photo_url)}" alt="${esc(a.title)}">` : "";
    approvals += `
      <div class="approval">
        ${photo}
        <div class="approval-body">
          <div class="row between"><b>${esc(a.title)}</b><span class="price">${money(a.price)}</span></div>
          <p class="muted">${esc(a.note)}</p>
          <div>${tag}</div>
        </div>
      </div>`;
  }
  if (approvals === "") approvals = `<p class="muted">No photos sent yet.</p>`;

  let approvalForm = "";
  if (!finished) {
    approvalForm = `
      <form class="form-grid" onsubmit="sendApproval(event, ${r.id})">
        <label class="field">Work needed<input name="work"></label>
        <label class="field">Price<input name="price" type="number" step="0.01"></label>
        <label class="field span-2">Note to customer<input name="note"></label>
        <label class="field span-2">Photo<input name="photo" type="file" accept="image/*"></label>
        <p class="error span-2" id="approval-error"></p>
        <button class="btn span-2">Send to Customer</button>
      </form>`;
  }

  // Invoice buttons
  let invoiceButtons = "";
  if (!invoice) {
    if (pending) {
      invoiceButtons = `<p class="muted">Waiting on customer approval before invoicing.</p>`;
    } else if (!finished) {
      invoiceButtons = `<button class="btn" onclick="createInvoice(${r.id}, ${r.total})">Generate Invoice</button>`;
    }
  } else {
    invoiceButtons = `<button class="btn btn-ghost" onclick="viewInvoice(${r.id})">View Invoice</button>`;
    if (invoice.status !== "Paid") {
      invoiceButtons += ` <button class="btn" onclick="markPaid(${r.id}, ${invoice.id})">Mark as Paid</button>`;
    } else {
      invoiceButtons += ` <span class="tag tag-green">Paid</span>`;
    }
  }

  drawPage("repairs", `Repair Order #${r.id}`,
    `${esc(r.customer_name)}, ${esc(r.customer_phone)}<br>${esc(r.vehicle_name)}, ${esc(r.vehicle_plate)}`, `
    <div class="grid">
      <div class="col">
        <section class="card stack">
          <h2>Work Order</h2>
          ${r.concern ? `<p class="muted"><b>Customer concern:</b> ${esc(r.concern)}</p>` : ""}
          <p class="muted"><b>Appointment:</b> ${PA.date(r.appt_date)}, ${PA.time(r.appt_time)}</p>
          <div class="form-grid">
            <label class="field">Status${statusBox}</label>
            <label class="field">Technician${techBox}</label>
          </div>
        </section>
        <section class="card stack">
          <h2>Services and Parts</h2>
          ${makeTable(["Item", ">Amount"], itemRows, "No items yet.")}
          ${addForms}
        </section>
        <section class="card stack">
          <h2>Customer Approvals</h2>
          ${approvals}
          ${approvalForm}
        </section>
      </div>
      <section class="card upcoming">
        <h2>Invoice</h2>
        <div class="totals" style="margin:12px 0">
          <div><span>Subtotal</span><span>${money(r.subtotal)}</span></div>
          <div><span>Tax (${PA.SHOP.taxRate}%)</span><span>${money(r.tax)}</span></div>
          <div class="grand"><span>Total</span><span>${money(r.total)}</span></div>
        </div>
        ${invoiceButtons}
      </section>
    </div>`);
}

function changeStatus(id, status) {
  save(ownerApi("PATCH", "/repairs/" + id, { status: status }));
}

function changeTech(id, techId) {
  save(ownerApi("PATCH", "/repairs/" + id, { technician_id: techId === "" ? null : Number(techId) }));
}

function addService(id) {
  const serviceId = Number(document.getElementById("new-service").value);
  save(ownerApi("POST", "/repairs/" + id + "/services", { service_id: serviceId }));
}

function addPart(id) {
  const partId = Number(document.getElementById("new-part").value);
  save(ownerApi("POST", "/repairs/" + id + "/parts", { part_id: partId, qty: 1 }));
}

function sendApproval(event, id) {
  event.preventDefault();
  const form = event.target;
  const error = document.getElementById("approval-error");
  const work = form.work.value.trim();
  const price = Number(form.price.value);
  const file = form.photo.files[0];

  if (work === "" || price <= 0) {
    error.textContent = "Please enter the work needed and a price.";
    return;
  }
  if (!file) {
    error.textContent = "Please add a photo so the customer can see the problem.";
    return;
  }
  if (file.size > 1000000) {
    error.textContent = "Please use a photo under 1 MB.";
    return;
  }

  // Turn the photo into text so it can be saved in the database
  const reader = new FileReader();
  reader.onload = function () {
    save(ownerApi("POST", "/repairs/" + id + "/approvals", {
      title: work,
      note: form.note.value.trim(),
      price: price,
      photo_url: reader.result
    }), "Sent to the customer for approval.");
  };
  reader.readAsDataURL(file);
}

function createInvoice(id, total) {
  save(ownerApi("POST", "/transactions", { repair_id: id, amount: total, status: "Unpaid" }));
}

async function markPaid(repairId, transactionId) {
  try {
    await ownerApi("PATCH", "/transactions/" + transactionId, { status: "Paid", date: PA.iso(0) });
    await ownerApi("PATCH", "/repairs/" + repairId, { status: "Completed" });
  } catch (e) {
    alert(e.message);
  }
  showPage();
}

async function viewInvoice(repairId) {
  try {
    PA.showInvoice(await ownerApi("GET", "/repairs/" + repairId));
  } catch (e) {
    alert(e.message);
  }
}


// ---------- Customers and Vehicles ----------

function customersPage() {
  let rows = "";
  for (const c of data.customers) {
    const vehicleCount = data.vehicles.filter(v => v.customer_id === c.id).length;
    rows += `<tr><td>#${c.id}</td><td>${esc(PA.customerName(c))}</td><td>${esc(c.phone)}</td><td>${esc(c.email)}</td><td>${vehicleCount}</td></tr>`;
  }
  drawPage("customers", "Customers", "Everyone with an account.", `
    <section class="card">${makeTable(["ID", "Name", "Phone", "Email", "Vehicles"], rows, "No customers yet.")}</section>`);
}

function vehiclesPage() {
  let rows = "";
  for (const v of data.vehicles) {
    const owner = data.customers.find(c => c.id === v.customer_id);
    rows += `<tr><td>${esc(PA.vehicleName(v))}</td><td>${esc(v.vin)}</td><td>${esc(v.plate)}</td><td>${esc(PA.customerName(owner))}</td><td class="right">${(v.odometer || 0).toLocaleString()} mi</td></tr>`;
  }
  drawPage("vehicles", "Vehicles", "All vehicles on file.", `
    <section class="card">${makeTable(["Vehicle", "VIN", "Plate", "Owner", ">Odometer"], rows, "No vehicles yet.")}</section>`);
}


// ---------- Employees ----------

function employeesPage() {
  let rows = "";
  for (const e of data.employees) {
    const jobs = data.repairs.filter(r => r.technician_id === e.id && OPEN.includes(r.status)).length;
    rows += `<tr><td>${esc(e.name)}</td><td>${esc(e.role)}</td><td>${esc(e.phone)}</td><td>${jobs}</td></tr>`;
  }
  drawPage("employees", "Employees", "Staff and how many open jobs each has.", `
    <div class="grid">
      <section class="card">${makeTable(["Name", "Role", "Phone", "Open jobs"], rows, "No employees yet.")}</section>
      <section class="card">
        <h2>Add Employee</h2>
        <form class="stack" style="gap:12px;margin-top:12px" onsubmit="addEmployee(event)">
          <label class="field">Name<input name="empName"></label>
          <label class="field">Role<select name="role"><option>Technician</option><option>Master Technician</option><option>Service Advisor</option></select></label>
          <label class="field">Phone<input name="phone" type="tel"></label>
          <p class="error" id="error"></p>
          <button class="btn">Add</button>
        </form>
      </section>
    </div>`);
}

function addEmployee(event) {
  event.preventDefault();
  const form = event.target;
  if (form.empName.value.trim() === "") {
    document.getElementById("error").textContent = "Please enter a name.";
    return;
  }
  save(ownerApi("POST", "/employees", {
    name: form.empName.value.trim(),
    role: form.role.value,
    phone: form.phone.value.trim()
  }));
}


// ---------- Parts ----------

function partsPage() {
  let rows = "";
  for (const p of data.parts) {
    const low = p.stock <= p.reorder ? ` <span class="tag tag-amber">Low</span>` : "";
    rows += `
      <tr>
        <td>${esc(p.name)}${low}</td>
        <td>${esc(p.sku)}</td>
        <td class="right">${p.stock}</td>
        <td class="right">${money(p.price)}</td>
        <td class="right"><button class="btn btn-ghost btn-sm" onclick="orderPart(${p.id})">Order 5</button></td>
      </tr>`;
  }
  drawPage("parts", "Parts", "Inventory. Parts at or below their reorder level are marked Low.", `
    <div class="grid">
      <section class="card">${makeTable(["Part", "SKU", ">In stock", ">Price", ""], rows, "No parts yet.")}</section>
      <section class="card">
        <h2>Add Part</h2>
        <form class="stack" style="gap:12px;margin-top:12px" onsubmit="addNewPart(event)">
          <label class="field">Name<input name="partName"></label>
          <label class="field">SKU<input name="sku"></label>
          <div class="form-grid">
            <label class="field">Stock<input name="stock" type="number"></label>
            <label class="field">Reorder at<input name="reorder" type="number"></label>
            <label class="field">Cost<input name="cost" type="number" step="0.01"></label>
            <label class="field">Price<input name="price" type="number" step="0.01"></label>
          </div>
          <p class="error" id="error"></p>
          <button class="btn">Add</button>
        </form>
      </section>
    </div>`);
}

function orderPart(id) {
  const part = data.parts.find(p => p.id === id);
  save(ownerApi("PATCH", "/parts/" + id, { stock: part.stock + 5 }), "Ordered 5 more " + part.name + ".");
}

function addNewPart(event) {
  event.preventDefault();
  const form = event.target;
  if (form.partName.value.trim() === "" || form.sku.value.trim() === "" || form.stock.value === "" || form.reorder.value === "" || form.cost.value === "" || form.price.value === "") {
    document.getElementById("error").textContent = "Please fill in every field.";
    return;
  }
  save(ownerApi("POST", "/parts", {
    name: form.partName.value.trim(),
    sku: form.sku.value.trim(),
    stock: Number(form.stock.value),
    reorder: Number(form.reorder.value),
    cost: Number(form.cost.value),
    price: Number(form.price.value)
  }));
}


// ---------- Services ----------

function servicesPage() {
  let rows = "";
  for (const s of data.services) {
    rows += `<tr><td>${esc(s.name)}</td><td class="right">${s.hours}</td><td class="right">${money(s.price)}</td></tr>`;
  }
  drawPage("services", "Services", "The list customers book from.", `
    <div class="grid">
      <section class="card">${makeTable(["Service", ">Hours", ">Price"], rows, "No services yet.")}</section>
      <section class="card">
        <h2>Add Service</h2>
        <form class="stack" style="gap:12px;margin-top:12px" onsubmit="addNewService(event)">
          <label class="field">Name<input name="serviceName"></label>
          <div class="form-grid">
            <label class="field">Price<input name="price" type="number" step="0.01"></label>
            <label class="field">Hours<input name="hours" type="number" step="0.25"></label>
          </div>
          <label class="field">Included checks (separate with commas)<input name="checks"></label>
          <p class="error" id="error"></p>
          <button class="btn">Add</button>
        </form>
      </section>
    </div>`);
}

function addNewService(event) {
  event.preventDefault();
  const form = event.target;
  if (form.serviceName.value.trim() === "" || form.price.value === "" || form.hours.value === "") {
    document.getElementById("error").textContent = "Please enter a name, price, and hours.";
    return;
  }
  save(ownerApi("POST", "/services", {
    name: form.serviceName.value.trim(),
    price: Number(form.price.value),
    hours: Number(form.hours.value),
    checklist: form.checks.value.trim()
  }));
}


// ---------- Transactions ----------

function transactionsPage() {
  const list = data.transactions.slice();
  list.sort((a, b) => b.date.localeCompare(a.date));

  let rows = "";
  for (const t of list) {
    const r = findRepair(t.repair_id);
    const tagColor = t.status === "Paid" ? "green" : "amber";
    rows += `
      <tr>
        <td>#${t.id}</td>
        <td>${PA.shortDate(t.date)}</td>
        <td><a class="link" href="#repair/${t.repair_id}">#${t.repair_id}</a></td>
        <td>${esc(r ? r.customer_name : "")}</td>
        <td><span class="tag tag-${tagColor}">${esc(t.status)}</span></td>
        <td class="right">${money(t.amount)}</td>
        <td class="right"><button class="btn btn-ghost btn-sm" onclick="viewInvoice(${t.repair_id})">Invoice</button></td>
      </tr>`;
  }
  drawPage("transactions", "Transactions", "Invoices and payments.", `
    <section class="card">${makeTable(["ID", "Date", "RO", "Customer", "Status", ">Amount", ""], rows, "No transactions yet.")}</section>`);
}


// ---------- Settings ----------

function settingsPage() {
  const s = PA.SHOP;
  drawPage("settings", "Settings", "Shop details shown to customers and on invoices.", `
    <section class="card stack">
      <p><b>Shop name:</b> ${esc(s.name)}</p>
      <p><b>Phone:</b> ${esc(s.phone)}</p>
      <p><b>Address:</b> ${esc(s.address)}</p>
      <p><b>Hours:</b> ${esc(s.hours)}</p>
      <p><b>Sales tax:</b> ${s.taxRate}%</p>
      <p class="muted">To change these, edit SHOP in web/shared/api.js. The tax rate is also set in api/repairs.js.</p>
    </section>`);
}


// ---------- Pick which section to show ----------

async function showPage() {
  if (!PA.getToken("owner")) {
    loginPage();
    return;
  }

  try {
    await loadData();
  } catch (e) {
    if (PA.getToken("owner")) PA.showMessage(e.message);
    return;
  }

  const parts = location.hash.slice(1).split("/");
  const section = parts[0];

  if (section === "repair") await repairDetailPage(Number(parts[1]));
  else if (section === "repairs") repairsPage();
  else if (section === "customers") customersPage();
  else if (section === "vehicles") vehiclesPage();
  else if (section === "employees") employeesPage();
  else if (section === "parts") partsPage();
  else if (section === "services") servicesPage();
  else if (section === "transactions") transactionsPage();
  else if (section === "settings") settingsPage();
  else overviewPage();
}

window.addEventListener("hashchange", function () {
  showPage();
  window.scrollTo(0, 0);
});
showPage();
