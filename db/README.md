# Database

PostgreSQL schema for Penguin Auto Specialists. Tables match `web/shared/store.js`.

## Files
- `schema.sql` – creates all tables and views (drops them first, so it can be re-run)
- `seed.sql` – sample data (same customers, vehicles, repairs, etc. as the website)

## Tables
| Table | What it holds |
|---|---|
| shop_settings | Shop name, phone, address, hours, tax rate (one row) |
| customers | Customer accounts |
| vehicles | Cars, keyed by VIN, linked to a customer |
| employees | Staff and their role (Owner, Service Advisor, Technician) |
| services | Service menu with price and labor hours |
| service_checks | Checklist items for each service |
| parts | Parts inventory with stock and reorder level |
| repairs | Repair orders / appointments and their status |
| repair_services | Services on a repair |
| repair_parts | Parts used on a repair |
| repair_approvals | Extra work waiting on customer approval |
| transactions | Payments for repairs |

Views: `repair_totals` (subtotal, tax, total per repair) and `low_stock_parts`.

## Set up on Supabase
1. Create a project at supabase.com.
2. Open SQL Editor, paste `schema.sql`, click Run.
3. Paste `seed.sql`, click Run.
4. Project Settings → Database → copy the connection string into a `.env` file as `DATABASE_URL` (never commit `.env`).

## Run locally
```
createdb penguin_auto
psql -d penguin_auto -f db/schema.sql
psql -d penguin_auto -f db/seed.sql
```
