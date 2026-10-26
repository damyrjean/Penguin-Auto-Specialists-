// Sample data for the customer dashboard.
// Later this will come from the Express API (GET /customers/:id, /vehicles/:vin, /repairs?customer_id=).
const data = {
  customerId: "98421",
  customerName: "User Customer",
  customerFirst: "User",
  vehicleName: "2021 Ford F-150",
  vehicleModel: "F-150",
  vehicleTrim: "SuperCrew Cab • Lariat • 3.5L V6 EcoBoost",
  vehicleTrimShort: "SuperCrew • Lariat",
  odometer: "64,250 mi",
  plate: "7XYZ99 (CO)",
  serviceName: "60,000 Mile Maintenance",
  serviceWhen: "Tomorrow",
  serviceDate: "October 12, 2025 • 9:00 AM",
  advisor: "Dave R.",
  estimate: "$245.00",
  checks: [
    "Full Engine Spark Plugs check",
    "Transmission fluid exchange & line flush",
    "On-road suspension damper diagnostics"
  ]
};

document.querySelectorAll("[data-field]").forEach(el => {
  const value = data[el.dataset.field];
  if (value !== undefined) el.textContent = value;
});

document.getElementById("checks").innerHTML =
  data.checks.map(c => `<li>${c}</li>`).join("");
