-- Sample data matching web/shared/store.js. Run after schema.sql.
-- Appointment dates are relative to today so the dashboards always have current data.

insert into shop_settings (shop_name, phone, address, hours, timezone, tax_rate) values
  ('Penguin Auto Specialists', '(386) 555-0142', '100 Sample St, Palm Coast, FL 32164',
   'Mon to Sat, 8:00 AM to 5:30 PM', 'America/New_York', 7);

insert into customers (id, first_name, last_name, phone, email) values
  (98421, 'User',  'Customer', '(386) 555-0101', 'user@example.com'),
  (98422, 'Renee', 'Caldwell', '(386) 555-0102', 'renee@example.com'),
  (98423, 'Tomas', 'Alvarez',  '(386) 555-0103', 'tomas@example.com'),
  (98424, 'Priya', 'Nair',     '(386) 555-0104', 'priya@example.com');
select setval('customers_id_seq', (select max(id) from customers));

insert into vehicles (vin, customer_id, year, make, model, trim, plate, odometer, is_primary) values
  ('1FTFW1E85MFA00001', 98421, 2021, 'Ford',      'F-150',   'SuperCrew Cab, Lariat, 3.5L V6 EcoBoost', '7XYZ99 (FL)',  59250, true),
  ('2HGFC2F59JH500002', 98421, 2018, 'Honda',     'Civic',   'LX Sedan, 2.0L I4',                       'KLM 482 (FL)', 81420, false),
  ('5TDZA23C86S500003', 98422, 2019, 'Toyota',    'Sienna',  'LE, 3.5L V6',                             'PQT 310 (FL)', 72880, true),
  ('1G1ZD5ST5KF100004', 98423, 2019, 'Chevrolet', 'Malibu',  'LT, 1.5L Turbo',                          'RDH 774 (FL)', 66105, true),
  ('5NPD84LF1LH500005', 98424, 2020, 'Hyundai',   'Elantra', 'SEL, 2.0L I4',                            'BVC 219 (FL)', 40312, true);

insert into employees (id, name, role, phone, active) values
  (1, 'Dave Rollins',  'Service Advisor',   '(386) 555-0120', true),
  (2, 'Luis Ortega',   'Master Technician', '(386) 555-0121', true),
  (3, 'Kayla Brooks',  'Technician',        '(386) 555-0122', true),
  (4, 'Sam Whitfield', 'Technician',        '(386) 555-0123', true);
select setval('employees_id_seq', (select max(id) from employees));

insert into services (id, name, price, hours) values
  (1, '60,000 Mile Maintenance',   245.00, 2.5),
  (2, 'Synthetic Oil Change',       79.95, 0.5),
  (3, 'Tire Rotation and Balance',  59.95, 0.75),
  (4, 'Brake Inspection',           49.95, 0.5),
  (5, 'AC Service',                149.95, 1.25),
  (6, 'Diagnostic Inspection',     110.00, 1);
select setval('services_id_seq', (select max(id) from services));

insert into service_checks (service_id, description, sort_order) values
  (1, 'Full engine spark plug check', 1),
  (1, 'Transmission fluid exchange and line flush', 2),
  (1, 'On road suspension damper check', 3),
  (2, 'Oil and filter', 1), (2, 'Fluid top off', 2), (2, 'Tire pressure check', 3),
  (3, 'Rotate all four tires', 1), (3, 'Balance', 2), (3, 'Tread depth check', 3),
  (4, 'Pad and rotor measurement', 1), (4, 'Brake fluid test', 2),
  (5, 'Recover and recharge', 1), (5, 'Leak check', 2), (5, 'Vent temperature test', 3),
  (6, 'Code scan', 1), (6, 'Road test', 2), (6, 'Written findings', 3);

insert into parts (id, name, sku, stock, reorder, cost, price) values
  (1, 'Front Brake Pad Set', 'BP-1140',  6,  4, 38, 72),
  (2, 'Front Brake Rotor',   'BR-2207',  3,  4, 46, 89),
  (3, 'Oil Filter',          'OF-0031', 24, 10,  4, 11),
  (4, 'Cabin Air Filter',    'CF-0310',  9,  5,  9, 28),
  (5, 'Serpentine Belt',     'SB-4420',  2,  3, 21, 54),
  (6, 'Wiper Blade Pair',    'WB-1800', 14,  6, 12, 32);
select setval('parts_id_seq', (select max(id) from parts));

insert into repairs (id, customer_id, vin, technician_id, status, concern, appt_date, appt_time) values
  (4913, 98421, '2HGFC2F59JH500002', 2,    'In Progress', 'Grinding noise when braking', current_date,       '08:30'),
  (4914, 98421, '1FTFW1E85MFA00001', 3,    'Scheduled',   null,                          current_date + 1,   '09:00'),
  (4915, 98422, '5TDZA23C86S500003', null, 'Requested',   'AC blows warm at idle',       current_date + 2,   '10:30'),
  (4916, 98423, '1G1ZD5ST5KF100004', 4,    'Ready',       null,                          current_date,       '11:00'),
  (4890, 98421, '1FTFW1E85MFA00001', 2,    'Completed',   null,                          current_date - 64,  '09:30'),
  (4851, 98421, '2HGFC2F59JH500002', 3,    'Completed',   'AC not cold',                 current_date - 132, '13:00'),
  (4902, 98424, '5NPD84LF1LH500005', 4,    'Completed',   null,                          current_date - 3,   '14:00');
select setval('repairs_id_seq', (select max(id) from repairs));

-- copy current service prices onto each repair
insert into repair_services (repair_id, service_id, price)
select r.repair_id, r.service_id, s.price
from (values (4913, 4), (4914, 1), (4915, 5), (4916, 2), (4916, 3),
             (4890, 2), (4890, 3), (4851, 5), (4902, 2)) as r(repair_id, service_id)
join services s on s.id = r.service_id;

insert into repair_parts (repair_id, part_id, qty, price)
select r.repair_id, r.part_id, r.qty, p.price
from (values (4916, 3, 1), (4890, 3, 1), (4851, 4, 1), (4902, 3, 1)) as r(repair_id, part_id, qty)
join parts p on p.id = r.part_id;

insert into repair_approvals (repair_id, title, note, price, status) values
  (4913, 'Replace front pads and rotors', 'Front pads are down to 2 mm and the rotors are scored.', 322, 'pending');

-- payments for completed repairs, amount taken from the invoice total
insert into transactions (id, repair_id, date, amount, method, status)
select t.id, t.repair_id, r.appt_date, rt.total, 'Card', 'Paid'
from (values (7001, 4890), (7002, 4851), (7003, 4902)) as t(id, repair_id)
join repairs r on r.id = t.repair_id
join repair_totals rt on rt.repair_id = t.repair_id;
select setval('transactions_id_seq', (select max(id) from transactions));
