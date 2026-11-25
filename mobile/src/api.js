// Shared code for the customer and owner screens.
// Same job as web/shared/api.js on the website: call the API and format values.
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Where the API is running.
// In Expo Go, the phone can't use "localhost" (that would be the phone itself),
// so we use the same computer address that Expo Go loaded the app from, on port 3000.
// Change this when the API is put online.
const host = Constants.expoConfig && Constants.expoConfig.hostUri
  ? Constants.expoConfig.hostUri.split(":")[0]
  : "localhost";
export const API_URL = "http://" + host + ":3000/api";

// Shop info shown on screens and invoices (same as the website)
export const SHOP = {
  name: "Penguin Auto Specialists",
  phone: "(386) 555-0142",
  address: "100 Sample St, Palm Coast, FL 32164",
  hours: "Mon to Sat, 8:00 AM to 5:30 PM",
  taxRate: 7
};


// ---------- Login tokens (saved on the phone) ----------

const tokens = { customer: null, owner: null };

export async function loadTokens() {
  try {
    tokens.customer = await AsyncStorage.getItem("pa-token-customer");
    tokens.owner = await AsyncStorage.getItem("pa-token-owner");
  } catch (e) { }
  return tokens;
}

export function getToken(role) {
  return tokens[role];
}

export async function setToken(role, token) {
  tokens[role] = token;
  try { await AsyncStorage.setItem("pa-token-" + role, token); } catch (e) { }
}

export async function logout(role) {
  tokens[role] = null;
  try { await AsyncStorage.removeItem("pa-token-" + role); } catch (e) { }
}

// App.js sets this so an expired login sends the user back to the login screen
let onExpired = () => { };
export function whenLoginExpires(fn) {
  onExpired = fn;
}


// ---------- Calling the API ----------
// role is "customer", "owner", or null (no login needed)
// Example: await api("GET", "/my/vehicles", null, "customer")

export async function api(method, path, body, role) {
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
    throw new Error("Can't reach the API at " + API_URL + ". Make sure it is running (npm run dev in the api folder) and your phone is on the same Wi-Fi as your computer.");
  }
  const data = await res.json();

  // Login expired or missing: go back to the login screen
  if (res.status === 401 && role) {
    await logout(role);
    onExpired(role);
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}


// ---------- Formatting ----------

export const money = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Today as "2026-11-20" (offset adds days)
export const iso = offset => {
  const d = new Date(); d.setDate(d.getDate() + (offset || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const date = s => parse(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
export const shortDate = s => parse(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const relative = s => {
  const days = Math.round((parse(s) - parse(iso(0))) / 86400000);
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 1 ? `In ${days} days` : shortDate(s);
};

// "13:00:00" -> "1:00 PM"
export const time = t => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export const vehicleName = v => v ? `${v.year} ${v.make} ${v.model}` : "";
export const customerName = c => c ? `${c.first_name} ${c.last_name}` : "";

// Line items on a repair from the API (services, parts, approved extra work)
export function lineItems(r) {
  const items = [];
  for (const s of r.services) items.push({ label: s.name, qty: 1, amount: s.price });
  for (const p of r.parts) items.push({ label: p.name, qty: p.qty, amount: p.price * p.qty });
  for (const a of r.approvals) {
    if (a.status === "approved") items.push({ label: a.title, qty: 1, amount: a.price });
  }
  return items;
}
