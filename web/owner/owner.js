// Owner website.
// This is one HTML page. The part of the URL after # picks the section,
// for example #overview, #parts, or #repair/4913.
// All data comes from PA (web/shared/store.js).

const root = document.getElementById("root");
const icons = PA.icons;
const esc = PA.esc;
const money = PA.money;

const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];


// ---------- Lookups ----------

function customerFor(repair) {
  return PA.by(PA.db.customers, "id", repair.customerId);
}

function vehicleFor(repair) {
  return PA.by(PA.db.vehicles, "vin", repair.vin);
}

function techName(repair) {
  const tech = PA.by(PA.db.employees, "id", repair.techId);
  return tech ? tech.name : "Unassigned";
}

function hasPendingApproval(repair) {
  return repair.approvals.some(a => a.status === "pending");
}

function findRepair(id) {
  return PA.by(PA.db.repairs, "id", id);
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
        <a class="switch-link" href="../customer/">Switch to customer view</a>
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
    const waiting = hasPendingApproval(r) ? ` <span class="tag tag-amber">Awaiting customer</span>` : "";
    rows += `
      <tr>
        <td><a class="link" href="#repair/${r.id}">#${r.id}</a></td>
        <td>${esc(PA.customerName(customerFor(r)))}</td>
        <td>${esc(PA.vehicleName(vehicleFor(r)))}</td>
        <td>${PA.shortDate(r.date)}, ${r.time}</td>
        <td>${esc(techName(r))}</td>
        <td>${PA.statusTag(r.status)}${waiting}</td>
      </tr>`;
  }
  return rows;
}

const REPAIR_HEADERS = ["RO", "Customer", "Vehicle", "Date", "Technician", "Status"];


// ---------- Overview ----------

function overviewPage() {
  const open = PA.db.repairs.filter(r => OPEN.includes(r.status));
  open.sort((a, b) => a.date.localeCompare(b.date));
  const requests = open.filter(r => r.status === "Requested");
  const lowStock = PA.db.parts.filter(p => p.stock <= p.reorder);

  let requestRows = "";
  for (const r of requests) {
    requestRows += `
      <tr>
        <td><a class="link" href="#repair/${r.id}">#${r.id}</a></td>
        <td>${esc(PA.customerName(customerFor(r)))}</td>
        <td>${esc(PA.vehicleName(vehicleFor(r)))}</td>
        <td>${PA.shortDate(r.date)}, ${r.time}</td>
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
  findRepair(id).status = "Scheduled";
  PA.save();
  showPage();
}


// ---------- Repairs list ----------

function repairsPage() {
  const list = PA.db.repairs.slice();
  list.sort((a, b) => b.date.localeCompare(a.date));
  drawPage("repairs", "Repairs", "Every repair order, newest first.", `
    <section class="card">${makeTable(REPAIR_HEADERS, repairRows(list), "No repairs yet.")}</section>`);
}


// ---------- One repair order ----------

function repairDetailPage(id) {
  const r = findRepair(id);
  if (!r) {
    drawPage("repairs", "Repair not found", `<a class="link" href="#repairs">Back to repairs</a>`, "");
    return;
  }

  const customer = customerFor(r);
  const vehicle = vehicleFor(r);
  const totals = PA.totals(r);
  const invoice = PA.by(PA.db.transactions, "repairId", r.id);
  const finished = r.status === "Completed" || r.status === "Cancelled";

  // Status and technician
  let statusBox = PA.statusTag(r.status);
  let techBox = esc(techName(r));
  if (!finished) {
    let statusOptions = "";
    for (const s of OPEN) {
      statusOptions += `<option ${s === r.status ? "selected" : ""}>${s}</option>`;
    }
    statusBox = `<select onchange="changeStatus(${r.id}, this.value)">${statusOptions}</select>`;

    let techOptions = `<option value="">Unassigned</option>`;
    for (const e of PA.db.employees) {
      if (e.role === "Service Advisor") continue;
      techOptions += `<option value="${e.id}" ${e.id === r.techId ? "selected" : ""}>${esc(e.name)}</option>`;
    }
    techBox = `<select onchange="changeTech(${r.id}, this.value)">${techOptions}</select>`;
  }

  // Line items
  let itemRows = "";
  for (const item of totals.items) {
    itemRows += `<tr><td>${esc(item.label)}${item.qty > 1 ? " x " + item.qty : ""}</td><td class="right">${money(item.amount)}</td></tr>`;
  }

  let addForms = "";
  if (!finished) {
    let serviceOptions = "";
    for (const s of PA.db.services) {
      serviceOptions += `<option value="${s.id}">${esc(s.name)}</option>`;
    }
    let partOptions = "";
    for (const p of PA.db.parts) {
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
    approvals += `
      <div class="approval">
        <img src="${esc(a.photo)}" alt="${esc(a.title)}">
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
    if (hasPendingApproval(r)) {
      invoiceButtons = `<p class="muted">Waiting on customer approval before invoicing.</p>`;
    } else if (!finished) {
      invoiceButtons = `<button class="btn" onclick="createInvoice(${r.id})">Generate Invoice</button>`;
    }
  } else {
    invoiceButtons = `<button class="btn btn-ghost" onclick="PA.showInvoice(findRepair(${r.id}))">View Invoice</button>`;
    if (invoice.status !== "Paid") {
      invoiceButtons += ` <button class="btn" onclick="markPaid(${r.id})">Mark as Paid</button>`;
    } else {
      invoiceButtons += ` <span class="tag tag-green">Paid</span>`;
    }
  }

  drawPage("repairs", `Repair Order #${r.id}`,
    `${esc(PA.customerName(customer))}, ${esc(customer.phone)}<br>${esc(PA.vehicleName(vehicle))}, ${esc(vehicle.plate)}`, `
    <div class="grid">
      <div class="col">
        <section class="card stack">
          <h2>Work Order</h2>
          ${r.concern ? `<p class="muted"><b>Customer concern:</b> ${esc(r.concern)}</p>` : ""}
          <p class="muted"><b>Appointment:</b> ${PA.date(r.date)}, ${r.time}</p>
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
          <div><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
          <div><span>Tax (${PA.db.settings.taxRate}%)</span><span>${money(totals.tax)}</span></div>
          <div class="grand"><span>Total</span><span>${money(totals.total)}</span></div>
        </div>
        ${invoiceButtons}
      </section>
    </div>`);
}

function changeStatus(id, status) {
  findRepair(id).status = status;
  PA.save();
  showPage();
}

function changeTech(id, techId) {
  findRepair(id).techId = techId === "" ? null : Number(techId);
  PA.save();
  showPage();
}

function addService(id) {
  const serviceId = Number(document.getElementById("new-service").value);
  findRepair(id).services.push(serviceId);
  PA.save();
  showPage();
}

function addPart(id) {
  const repair = findRepair(id);
  const part = PA.by(PA.db.parts, "id", Number(document.getElementById("new-part").value));

  if (part.stock < 1) {
    alert("That part is out of stock. Order more on the Parts page.");
    return;
  }

  const line = PA.by(repair.parts, "partId", part.id);
  if (line) {
    line.qty = line.qty + 1;
  } else {
    repair.parts.push({ partId: part.id, qty: 1 });
  }
  part.stock = part.stock - 1;
  PA.save();
  showPage();
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

  // Read the photo so it can be saved with the repair
  const reader = new FileReader();
  reader.onload = function () {
    const repair = findRepair(id);
    repair.approvals.push({
      id: repair.approvals.length + 1,
      title: work,
      note: form.note.value.trim(),
      price: price,
      status: "pending",
      photo: reader.result
    });

    if (PA.save()) {
      alert("Sent to the customer for approval.");
    } else {
      repair.approvals.pop();
      alert("Could not save. Try a smaller photo.");
    }
    showPage();
  };
  reader.readAsDataURL(file);
}

function createInvoice(id) {
  PA.db.transactions.push({
    id: PA.nextId(PA.db.transactions),
    repairId: id,
    date: PA.iso(0),
    status: "Unpaid"
  });
  PA.save();
  showPage();
}

function markPaid(id) {
  const invoice = PA.by(PA.db.transactions, "repairId", id);
  invoice.status = "Paid";
  invoice.date = PA.iso(0);
  findRepair(id).status = "Completed";
  PA.save();
  showPage();
}


// ---------- Customers and Vehicles ----------

function customersPage() {
  let rows = "";
  for (const c of PA.db.customers) {
    const vehicleCount = PA.db.vehicles.filter(v => v.customerId === c.id).length;
    rows += `<tr><td>#${c.id}</td><td>${esc(PA.customerName(c))}</td><td>${esc(c.phone)}</td><td>${esc(c.email)}</td><td>${vehicleCount}</td></tr>`;
  }
  drawPage("customers", "Customers", "Everyone with an account.", `
    <section class="card">${makeTable(["ID", "Name", "Phone", "Email", "Vehicles"], rows, "No customers yet.")}</section>`);
}

function vehiclesPage() {
  let rows = "";
  for (const v of PA.db.vehicles) {
    const owner = PA.by(PA.db.customers, "id", v.customerId);
    rows += `<tr><td>${esc(PA.vehicleName(v))}</td><td>${esc(v.vin)}</td><td>${esc(v.plate)}</td><td>${esc(PA.customerName(owner))}</td><td class="right">${v.odometer.toLocaleString()} mi</td></tr>`;
  }
  drawPage("vehicles", "Vehicles", "All vehicles on file.", `
    <section class="card">${makeTable(["Vehicle", "VIN", "Plate", "Owner", ">Odometer"], rows, "No vehicles yet.")}</section>`);
}


// ---------- Employees ----------

function employeesPage() {
  let rows = "";
  for (const e of PA.db.employees) {
    const jobs = PA.db.repairs.filter(r => r.techId === e.id && OPEN.includes(r.status)).length;
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
  PA.db.employees.push({
    id: PA.nextId(PA.db.employees),
    name: form.empName.value.trim(),
    role: form.role.value,
    phone: form.phone.value.trim(),
    active: true
  });
  PA.save();
  showPage();
}


// ---------- Parts ----------

function partsPage() {
  let rows = "";
  for (const p of PA.db.parts) {
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
  const part = PA.by(PA.db.parts, "id", id);
  part.stock = part.stock + 5;
  PA.save();
  alert("Ordered 5 more " + part.name + ".");
  showPage();
}

function addNewPart(event) {
  event.preventDefault();
  const form = event.target;
  if (form.partName.value.trim() === "" || form.sku.value.trim() === "" || form.stock.value === "" || form.reorder.value === "" || form.cost.value === "" || form.price.value === "") {
    document.getElementById("error").textContent = "Please fill in every field.";
    return;
  }
  PA.db.parts.push({
    id: PA.nextId(PA.db.parts),
    name: form.partName.value.trim(),
    sku: form.sku.value.trim(),
    stock: Number(form.stock.value),
    reorder: Number(form.reorder.value),
    cost: Number(form.cost.value),
    price: Number(form.price.value)
  });
  PA.save();
  showPage();
}


// ---------- Services ----------

function servicesPage() {
  let rows = "";
  for (const s of PA.db.services) {
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

  const checks = [];
  for (const c of form.checks.value.split(",")) {
    if (c.trim() !== "") checks.push(c.trim());
  }

  PA.db.services.push({
    id: PA.nextId(PA.db.services),
    name: form.serviceName.value.trim(),
    price: Number(form.price.value),
    hours: Number(form.hours.value),
    checks: checks
  });
  PA.save();
  showPage();
}


// ---------- Transactions ----------

function transactionsPage() {
  const list = PA.db.transactions.slice();
  list.sort((a, b) => b.date.localeCompare(a.date));

  let rows = "";
  for (const t of list) {
    const r = findRepair(t.repairId);
    const tagColor = t.status === "Paid" ? "green" : "amber";
    rows += `
      <tr>
        <td>#${t.id}</td>
        <td>${PA.shortDate(t.date)}</td>
        <td><a class="link" href="#repair/${r.id}">#${r.id}</a></td>
        <td>${esc(PA.customerName(customerFor(r)))}</td>
        <td><span class="tag tag-${tagColor}">${t.status}</span></td>
        <td class="right">${money(PA.totals(r).total)}</td>
        <td class="right"><button class="btn btn-ghost btn-sm" onclick="PA.showInvoice(findRepair(${r.id}))">Invoice</button></td>
      </tr>`;
  }
  drawPage("transactions", "Transactions", "Invoices and payments.", `
    <section class="card">${makeTable(["ID", "Date", "RO", "Customer", "Status", ">Amount", ""], rows, "No transactions yet.")}</section>`);
}


// ---------- Settings ----------

function settingsPage() {
  const s = PA.db.settings;
  drawPage("settings", "Settings", "Shop details shown to customers and on invoices.", `
    <div class="grid-even">
      <section class="card">
        <form class="stack" style="gap:12px" onsubmit="saveSettings(event)">
          <label class="field">Shop name<input name="shopName" value="${esc(s.shopName)}"></label>
          <label class="field">Phone<input name="phone" value="${esc(s.phone)}"></label>
          <label class="field">Address<input name="address" value="${esc(s.address)}"></label>
          <label class="field">Hours<input name="hours" value="${esc(s.hours)}"></label>
          <label class="field">Sales tax (%)<input name="taxRate" type="number" step="0.1" value="${s.taxRate}"></label>
          <button class="btn">Save</button>
        </form>
      </section>
      <section class="card">
        <h2>Demo Data</h2>
        <p class="muted" style="margin:8px 0 14px">Puts all the sample customers, repairs, and parts back to how they started.</p>
        <button class="btn btn-danger" onclick="resetData()">Reset Demo Data</button>
      </section>
    </div>`);
}

function saveSettings(event) {
  event.preventDefault();
  const form = event.target;
  const s = PA.db.settings;
  s.shopName = form.shopName.value.trim();
  s.phone = form.phone.value.trim();
  s.address = form.address.value.trim();
  s.hours = form.hours.value.trim();
  s.taxRate = Number(form.taxRate.value);
  PA.save();
  alert("Settings saved.");
}

function resetData() {
  if (confirm("Reset all demo data?")) {
    PA.reset();
    location.hash = "#overview";
    showPage();
  }
}


// ---------- Pick which section to show ----------

function showPage() {
  const parts = location.hash.slice(1).split("/");
  const section = parts[0];

  if (section === "repair") repairDetailPage(Number(parts[1]));
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
