-- Penguin Auto Specialists database (PostgreSQL / Supabase)
-- Shared by the website and the mobile app.
-- Run this first, then seed.sql.

drop table if exists transactions, approvals, repair_parts, repair_services,
  repairs, parts, services, employees, vehicles, customers;

create table customers (
  id         serial primary key,
  first_name text not null,
  last_name  text not null,
  phone      text,
  email      text unique not null,
  password   text                -- store a hashed password, never plain text
);

create table vehicles (
  id          serial primary key,
  customer_id int not null references customers(id),
  vin         text unique not null,
  year        int,
  make        text,
  model       text,
  plate       text,
  odometer    int
);

create table employees (
  id     serial primary key,
  name   text not null,
  role   text not null,          -- Owner, Service Advisor, Technician
  phone  text,
  active boolean default true
);

create table services (
  id        serial primary key,
  name      text not null,
  price     numeric(10,2) not null,
  hours     numeric(4,2),        -- labor hours
  checklist text                 -- what the service includes
);

create table parts (
  id      serial primary key,
  name    text not null,
  sku     text unique,
  stock   int default 0,
  reorder int default 0,         -- reorder when stock gets this low
  cost    numeric(10,2),
  price   numeric(10,2)
);

-- A repair order. Booking an appointment creates one with status 'Requested'.
-- Status: Requested, Scheduled, In Progress, Ready, Completed, Cancelled
create table repairs (
  id            serial primary key,
  customer_id   int not null references customers(id),
  vehicle_id    int not null references vehicles(id),
  technician_id int references employees(id),
  status        text default 'Requested',
  concern       text,
  appt_date     date not null,
  appt_time     time not null
);

-- Which services are on each repair
create table repair_services (
  repair_id  int references repairs(id),
  service_id int references services(id),
  primary key (repair_id, service_id)
);

-- Which parts were used on each repair
create table repair_parts (
  repair_id int references repairs(id),
  part_id   int references parts(id),
  qty       int default 1,
  primary key (repair_id, part_id)
);

-- Extra work the tech finds. The customer approves or declines it.
-- Status: pending, approved, declined
create table approvals (
  id        serial primary key,
  repair_id int not null references repairs(id),
  title     text not null,
  note      text,
  price     numeric(10,2) not null,
  status    text default 'pending',
  photo_url text
);

-- Payments
create table transactions (
  id        serial primary key,
  repair_id int not null references repairs(id),
  date      date default current_date,
  amount    numeric(10,2) not null,
  status    text default 'Unpaid'  -- Unpaid, Paid
);
