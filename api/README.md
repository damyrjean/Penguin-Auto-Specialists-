# API

Node + Express API that connects the website and mobile app to the Supabase database.

## Files
- `server.js` – starts the API and loads the routes
- `db.js` – connects to the database
- `auth.js` – login tokens and the customer / owner checks
- `repairs.js` – gets a repair's services, parts, approvals, and invoice total (7% tax)
- `routes/auth.js` – sign up and log in
- `routes/customer.js` – customer view (`/api/my/...`)
- `routes/owner.js` – owner view (`/api/owner/...`)

## Run it
1. Install Node.js (nodejs.org, LTS version).
2. In a terminal:
   ```
   cd api
   npm install
   ```
3. Copy `.env.example` to a new file named `.env` and fill in your Supabase connection string, a JWT secret, and an owner password.
4. Start it:
   ```
   npm run dev
   ```
5. Open http://localhost:3000/api/health in a browser. You should see `{"ok":true}`.

## How login works
1. The website calls a login route and gets back a `token`.
2. It sends that token with every request after that:
   `Authorization: Bearer <token>`
3. Customer tokens only see that customer's own data. Owner tokens see everything.

## Routes

### Public
| Method | Address | What it does |
|---|---|---|
| GET | /api/health | Check the API and database are running |
| GET | /api/services | Service menu and prices |
| POST | /api/register | Customer sign up `{ first_name, last_name, phone, email, password }` |
| POST | /api/login | Customer log in `{ email, password }` |
| POST | /api/owner/login | Owner log in `{ password }` |

Customers the shop already added (like the sample data) can use Register with the same email to set their password.

### Customer (needs customer token)
| Method | Address | What it does |
|---|---|---|
| GET | /api/my/account | My info |
| GET | /api/my/vehicles | My cars |
| POST | /api/my/vehicles | Add a car `{ vin, year, make, model, plate, odometer }` |
| GET | /api/my/repairs | My repairs with services, parts, approvals, and totals |
| POST | /api/my/repairs | Book an appointment `{ vehicle_id, appt_date, appt_time, concern, service_ids }` |
| PATCH | /api/my/approvals/:id | Approve or decline extra work `{ status: "approved" }` |

### Owner (needs owner token)
| Method | Address | What it does |
|---|---|---|
| GET | /api/owner/overview | Dashboard numbers and low stock parts |
| GET | /api/owner/repairs | All repairs (add `?status=Ready` to filter) |
| GET | /api/owner/repairs/:id | One repair with invoice total |
| PATCH | /api/owner/repairs/:id | Change status, technician, date, time, or concern |
| POST | /api/owner/repairs/:id/services | Add a service `{ service_id }` |
| POST | /api/owner/repairs/:id/parts | Add a part `{ part_id, qty }` (takes it out of stock) |
| POST | /api/owner/repairs/:id/approvals | Ask customer to approve extra work `{ title, note, price, photo_url }` |

These all have the same 4 routes: **customers, vehicles, employees, services, parts, transactions**

| Method | Address | What it does |
|---|---|---|
| GET | /api/owner/parts | List all |
| POST | /api/owner/parts | Add one |
| PATCH | /api/owner/parts/:id | Edit one |
| DELETE | /api/owner/parts/:id | Delete one |
