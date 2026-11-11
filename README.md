# Penguin Auto Specialists – Shop Management System

ETI 4448, Group 18
- Aidan Coburn
- Damyr Jean-Francois

One system for Penguin Auto Specialists: a website and a mobile app, each with a customer view and an owner view, sharing one database (customers, vehicles, repairs, employees, parts, services, transactions).

## Stack
- Database: PostgreSQL (Supabase free tier)
- API: Node + Express REST
- Web: React.js (Vercel)
- Mobile: React Native with Expo

## Branches (Git-Flow)
- `main` – released code
- `development` – integration branch
- `feature/*` – one branch per feature, merged into `development` by pull request

## Progress
- [x] Customer website: Dashboard, My Repair (photo approvals), Book Appointment, Service History, Vehicle Profile, Create Account (`web/customer/`)
- [x] Owner website: Overview, Repairs, Customers, Vehicles, Employees, Parts, Services, Transactions, Settings (`web/owner/`)
- [x] Database schema (`db/`, see `db/README.md`)
- [x] Load schema into Supabase
- [x] Express API and login (`api/`, see `api/README.md`)
- [x] Connect the website to the API (`web/shared/api.js`), with customer and owner logins
- [ ] React.js version of the website
- [ ] Mobile apps (Expo)

## Run it
1. Set up the database (see `db/README.md`).
2. Start the API (see `api/README.md`): `cd api`, `npm install`, `npm run dev`.
3. Open http://localhost:3000 in your browser. The API also serves the website.

Logins:
- Customer: go to Create Account. Sample customers (like user@example.com) can sign up with their email to set a password.
- Owner: the `OWNER_PASSWORD` in `api/.env`.
