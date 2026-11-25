// Shared code for the customer and owner pages.
// All data now comes from the Express API (the api/ folder), which reads Supabase.
const PA = (() => {
  // Where the API is running. Change this when the API is put online.
  const API_URL = "http://localhost:3000/api";

  // Shop info shown on pages and invoices
  const SHOP = {
    name: "Penguin Auto Specialists",
    phone: "(386) 555-0142",
    address: "100 Sample St, Palm Coast, FL 32164",
    hours: "Mon to Sat, 8:00 AM to 5:30 PM",
    taxRate: 7
  };


  // ---------- Login tokens (saved in the browser) ----------

  function getToken(role) {
    try { return localStorage.getItem("pa-token-" + role); } catch (e) { return null; }
  }
  function setToken(role, token) {
    try { localStorage.setItem("pa-token-" + role, token); } catch (e) { }
  }
  function logout(role) {
    try { localStorage.removeItem("pa-token-" + role); } catch (e) { }
  }


  // ---------- Calling the API ----------
  // role is "customer", "owner", or null (no login needed)
  // Example: await PA.api("GET", "/my/vehicles", null, "customer")

  async function api(method, path, body, role) {
    const options = { method: method, headers: {} };
    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    if (role) options.headers["Authorization"] = "Bearer " + getToken(role);

    let res;
    try {
      res = await fetch(API_URL + path, options);
    } catch (e) {
      throw new Error("Can't reach the API. Make sure it is running (npm run dev in the api folder).");
    }
    const data = await res.json();

    // Login expired or missing: go to the right login screen
    if (res.status === 401 && role) {
      logout(role);
      if (role === "customer") location.href = "login.html";
      else location.reload();
    }
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }


  // ---------- Formatting ----------

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Today as "2026-11-20" (offset adds days)
  const iso = offset => {
    const d = new Date(); d.setDate(d.getDate() + (offset || 0));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const date = s => parse(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const shortDate = s => parse(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const relative = s => {
    const days = Math.round((parse(s) - parse(iso(0))) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 1 ? `In ${days} days` : shortDate(s);
  };

  // "13:00:00" -> "1:00 PM"
  const time = t => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  const vehicleName = v => v ? `${v.year} ${v.make} ${v.model}` : "";
  const customerName = c => c ? `${c.first_name} ${c.last_name}` : "";

  function statusTag(s) {
    const cls = { Requested: "amber", Scheduled: "blue", "In Progress": "blue", Ready: "green", Completed: "gray", Cancelled: "red" }[s] || "gray";
    return `<span class="tag tag-${cls}">${esc(s)}</span>`;
  }

  // Line items on a repair from the API (services, parts, approved extra work)
  function lineItems(r) {
    const items = [];
    for (const s of r.services) items.push({ label: s.name, qty: 1, amount: s.price });
    for (const p of r.parts) items.push({ label: p.name, qty: p.qty, amount: p.price * p.qty });
    for (const a of r.approvals) {
      if (a.status === "approved") items.push({ label: a.title, qty: 1, amount: a.price });
    }
    return items;
  }


  // ---------- Invoice pop-up ----------
  // r is a full repair from the API (has services, parts, approvals, subtotal, tax, total)

  function showInvoice(r) {
    let rows = "";
    for (const l of lineItems(r)) {
      rows += `<tr><td>${esc(l.label)}</td><td class="right">${l.qty}</td><td class="right">${money(l.amount)}</td></tr>`;
    }
    const html = `
      <div class="invoice-head">
        <div><h2>${esc(SHOP.name)}</h2><p class="muted">${esc(SHOP.address)}<br>${esc(SHOP.phone)}</p></div>
        <div class="right"><b>Invoice for RO #${r.id}</b><p class="muted">${shortDate(r.appt_date)}<br>${esc(r.customer_name)}<br>${esc(r.vehicle_name)}</p></div>
      </div>
      <table class="table"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${money(r.subtotal)}</span></div>
        <div><span>Tax (${SHOP.taxRate}%)</span><span>${money(r.tax)}</span></div>
        <div class="grand"><span>Total</span><span>${money(r.total)}</span></div>
      </div>`;

    let dlg = document.getElementById("invoice-dialog");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "invoice-dialog"; dlg.className = "dialog"; document.body.append(dlg); }
    dlg.innerHTML = `<div id="invoice-body">${html}</div><div class="dialog-foot no-print"><button class="btn btn-ghost" data-close>Close</button><button class="btn" data-print>Print</button></div>`;
    dlg.querySelector("[data-close]").onclick = () => dlg.close();
    dlg.querySelector("[data-print]").onclick = () => window.print();
    dlg.showModal();
  }


  // Shown while a page is loading, or if the API can't be reached
  function showMessage(text) {
    document.getElementById("root").innerHTML =
      `<main class="center-page"><section class="card"><p class="muted">${esc(text)}</p></section></main>`;
  }


  // ---------- Icons ----------

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

  return { SHOP, api, getToken, setToken, logout, esc, money, iso, date, shortDate, relative, time,
           vehicleName, customerName, statusTag, lineItems, showInvoice, showMessage, icons };
})();
