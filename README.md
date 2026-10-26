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
- [x] Customer website – Dashboard page (`web/customer/`), static HTML/CSS/JS using sample data
- [ ] Customer website – Book Appointment, Service History, Vehicle Profile
- [ ] Owner web dashboard
- [ ] Database schema (Supabase)
- [ ] Express API
- [ ] Mobile apps (Expo)

## Run it
Open `web/customer/index.html` in a browser, or turn on GitHub Pages (Settings → Pages → deploy from `main`, root folder).
