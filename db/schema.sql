-- Penguin Auto Specialists - database schema (PostgreSQL / Supabase)
-- One database shared by the website and mobile app (customer and owner views).
-- Core records: customers, vehicles, repairs, employees, parts, services, transactions.
-- Run this first, then seed.sql for sample data.

drop table if exists transactions, repair_approvals, repair_parts, repair_services,
  repairs, service_checks, services, parts, employees, vehicles, customers, shop_settings cascade;

-- Shop info shown on invoices and the Settings page (one row)
create table shop_settings (
  id          int primary key default 1 check (id = 1),
  shop_name   text not null,
  phone       text,
  address     text,
  hours       text,
  timezone    text not null default 'America/New_York',
  tax_rate    numeric(5,2) not null default 7.00 check (tax_rate >= 0)
);

create table customers (
  id             serial primary key,
  first_name     text not null,
  last_name      text not null,
  phone          text,
  email          text not null unique,
  password_hash  text,                       -- set by the API at sign up (bcrypt)
  created_at     timestamptz not null default now()
);

create table vehicles (
  vin          char(17) primary key,
  customer_id  int not null references customers(id) on delete cascade,
  year         int not null check (year between 1950 and 2100),
  make         text not null,
  model        text not null,
  trim         text,
  plate        text,
  odometer     int check (odometer >= 0),
  is_primary   boolean not null default false
);
create index on vehicles (customer_id);
-- only one primary vehicle per customer
create unique index one_primary_vehicle on vehicles (customer_id) where is_primary;

create table employees (
  id             serial primary key,
  name           text not null,
  role           text not null check (role in ('Owner', 'Service Advisor', 'Master Technician', 'Technician')),
  phone          text,
  email          text unique,
  password_hash  text,                       -- only for staff who log in to the owner view
  active         boolean not null default true
);

create table services (
  id      serial primary key,
  name    text not null unique,
  price   numeric(10,2) not null check (price >= 0),
  hours   numeric(5,2) not null check (hours >= 0)   -- labor hours
);

-- Checklist items for each service (e.g. "Oil and filter")
create table service_checks (
  id          serial primary key,
  service_id  int not null references services(id) on delete cascade,
  description text not null,
  sort_order  int not null default 0
);

create table parts (
  id       serial primary key,
  name     text not null,
  sku      text not null unique,
  stock    int not null default 0 check (stock >= 0),
  reorder  int not null default 0 check (reorder >= 0),  -- reorder when stock <= this
  cost     numeric(10,2) not null check (cost >= 0),
  price    numeric(10,2) not null check (price >= 0)
);

-- A repair order (RO). Booking an appointment creates one with status 'Requested'.
create table repairs (
  id             serial primary key,
  customer_id    int not null references customers(id),
  vin            char(17) not null references vehicles(vin),
  technician_id  int references employees(id),
  status         text not null default 'Requested'
                 check (status in ('Requested', 'Scheduled', 'In Progress', 'Ready', 'Completed', 'Cancelled')),
  concern        text,
  appt_date      date not null,
  appt_time      time not null,
  created_at     timestamptz not null default now()
);
create index on repairs (customer_id);
create index on repairs (status);
create index on repairs (appt_date);

-- Services on a repair. Price is copied in so old invoices don't change when prices do.
create table repair_services (
  repair_id   int not null references repairs(id) on delete cascade,
  service_id  int not null references services(id),
  price       numeric(10,2) not null,
  primary key (repair_id, service_id)
);

-- Parts used on a repair
create table repair_parts (
  repair_id  int not null references repairs(id) on delete cascade,
  part_id    int not null references parts(id),
  qty        int not null check (qty > 0),
  price      numeric(10,2) not null,
  primary key (repair_id, part_id)
);

-- Extra work the tech finds; the customer approves or declines it on My Repair
create table repair_approvals (
  id          serial primary key,
  repair_id   int not null references repairs(id) on delete cascade,
  title       text not null,
  note        text,
  price       numeric(10,2) not null check (price >= 0),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  photo_url   text,                          -- Supabase Storage URL
  decided_at  timestamptz
);
create index on repair_approvals (repair_id);

create table transactions (
  id         serial primary key,
  repair_id  int not null references repairs(id),
  date       date not null default current_date,
  amount     numeric(10,2) not null check (amount >= 0),
  method     text check (method in ('Cash', 'Card', 'Check', 'Other')),
  status     text not null default 'Unpaid' check (status in ('Unpaid', 'Paid', 'Refunded'))
);
create index on transactions (repair_id);

-- Invoice totals for each repair (services + parts + approved extra work + tax)
create view repair_totals as
with items as (
  select repair_id, price as amount from repair_services
  union all
  select repair_id, price * qty from repair_parts
  union all
  select repair_id, price from repair_approvals where status = 'approved'
)
select r.id as repair_id,
       coalesce(sum(i.amount), 0)                                          as subtotal,
       round(coalesce(sum(i.amount), 0) * s.tax_rate / 100, 2)              as tax,
       coalesce(sum(i.amount), 0) + round(coalesce(sum(i.amount), 0) * s.tax_rate / 100, 2) as total
from repairs r
left join items i on i.repair_id = r.id
cross join shop_settings s
group by r.id, s.tax_rate;

-- Parts at or below their reorder level (owner Parts page)
create view low_stock_parts as
select * from parts where stock <= reorder;
