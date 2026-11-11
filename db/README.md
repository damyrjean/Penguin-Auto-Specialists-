# Database

PostgreSQL database for Penguin Auto Specialists.

## Files
- `schema.sql` creates the tables
- `seed.sql` adds sample data

## Tables
- **customers** – customer accounts
- **vehicles** – each customer's cars
- **employees** – shop staff
- **services** – service menu and prices
- **parts** – parts inventory
- **repairs** – appointments and repair orders
- **repair_services** – services on each repair
- **repair_parts** – parts used on each repair
- **approvals** – extra work the customer approves or declines
- **transactions** – payments

## Set up on Supabase
1. Create a project at supabase.com.
2. Open SQL Editor, paste `schema.sql`, click Run.
3. Paste `seed.sql`, click Run.
4. Copy the connection string (Project Settings → Database) into a `.env` file as `DATABASE_URL`. Don't commit `.env`.
