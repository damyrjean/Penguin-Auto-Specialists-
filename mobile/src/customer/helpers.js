// Small lookups shared by the customer screens (same as customer.js on the website)

export const STEPS = ["Requested", "Scheduled", "In Progress", "Ready", "Completed"];
export const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];
export const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

// The first car added is the primary one
export function primaryVehicle(data) {
  return data.vehicles[0];
}

export function myOpenRepairs(data) {
  const list = data.repairs.filter(r => OPEN.includes(r.status));
  list.sort((a, b) => a.appt_date.localeCompare(b.appt_date));
  return list;
}

export function techFor(repair) {
  return repair.technician_name || "Not assigned yet";
}

export function serviceNames(repair) {
  if (repair.services.length === 0) return "Service request";
  return repair.services.map(s => s.name).join(", ");
}

export function checksFor(service) {
  if (!service.checklist) return [];
  return service.checklist.split(",").map(c => {
    c = c.trim();
    return c.charAt(0).toUpperCase() + c.slice(1);
  });
}

export function miles(n) {
  return (n || 0).toLocaleString();
}
