-- Sample data (same as the website). Run after schema.sql.

insert into customers (first_name, last_name, phone, email) values
  ('User',  'Customer', '(386) 555-0101', 'user@example.com'),   -- id 1
  ('Renee', 'Caldwell', '(386) 555-0102', 'renee@example.com'),  -- id 2
  ('Tomas', 'Alvarez',  '(386) 555-0103', 'tomas@example.com'),  -- id 3
  ('Priya', 'Nair',     '(386) 555-0104', 'priya@example.com');  -- id 4

insert into vehicles (customer_id, vin, year, make, model, plate, odometer) values
  (1, '1FTFW1E85MFA00001', 2021, 'Ford',      'F-150',   '7XYZ99',  59250),  -- id 1
  (1, '2HGFC2F59JH500002', 2018, 'Honda',     'Civic',   'KLM 482', 81420),  -- id 2
  (2, '5TDZA23C86S500003', 2019, 'Toyota',    'Sienna',  'PQT 310', 72880),  -- id 3
  (3, '1G1ZD5ST5KF100004', 2019, 'Chevrolet', 'Malibu',  'RDH 774', 66105),  -- id 4
  (4, '5NPD84LF1LH500005', 2020, 'Hyundai',   'Elantra', 'BVC 219', 40312);  -- id 5

insert into employees (name, role, phone) values
  ('Dave Rollins',  'Service Advisor', '(386) 555-0120'),  -- id 1
  ('Luis Ortega',   'Technician',      '(386) 555-0121'),  -- id 2
  ('Kayla Brooks',  'Technician',      '(386) 555-0122'),  -- id 3
  ('Sam Whitfield', 'Technician',      '(386) 555-0123');  -- id 4

insert into services (name, price, hours, checklist) values
  ('60,000 Mile Maintenance',   245.00, 2.5,  'Spark plug check, transmission fluid exchange, suspension check'),
  ('Synthetic Oil Change',       79.95, 0.5,  'Oil and filter, fluid top off, tire pressure check'),
  ('Tire Rotation and Balance',  59.95, 0.75, 'Rotate all four tires, balance, tread depth check'),
  ('Brake Inspection',           49.95, 0.5,  'Pad and rotor measurement, brake fluid test'),
  ('AC Service',                149.95, 1.25, 'Recover and recharge, leak check, vent temperature test'),
  ('Diagnostic Inspection',     110.00, 1,    'Code scan, road test, written findings');

insert into parts (name, sku, stock, reorder, cost, price) values
  ('Front Brake Pad Set', 'BP-1140',  6,  4, 38, 72),
  ('Front Brake Rotor',   'BR-2207',  3,  4, 46, 89),
  ('Oil Filter',          'OF-0031', 24, 10,  4, 11),
  ('Cabin Air Filter',    'CF-0310',  9,  5,  9, 28),
  ('Serpentine Belt',     'SB-4420',  2,  3, 21, 54),
  ('Wiper Blade Pair',    'WB-1800', 14,  6, 12, 32);

insert into repairs (customer_id, vehicle_id, technician_id, status, concern, appt_date, appt_time) values
  (1, 2, 2,    'In Progress', 'Grinding noise when braking', '2026-11-11', '08:30'),  -- id 1
  (1, 1, 3,    'Scheduled',   null,                          '2026-11-12', '09:00'),  -- id 2
  (2, 3, null, 'Requested',   'AC blows warm at idle',       '2026-11-13', '10:30'),  -- id 3
  (3, 4, 4,    'Ready',       null,                          '2026-11-11', '11:00'),  -- id 4
  (1, 1, 2,    'Completed',   null,                          '2026-09-08', '09:30'),  -- id 5
  (1, 2, 3,    'Completed',   'AC not cold',                 '2026-07-02', '13:00'),  -- id 6
  (4, 5, 4,    'Completed',   null,                          '2026-11-08', '14:00');  -- id 7

insert into repair_services (repair_id, service_id) values
  (1, 4), (2, 1), (3, 5), (4, 2), (4, 3), (5, 2), (5, 3), (6, 5), (7, 2);

insert into repair_parts (repair_id, part_id, qty) values
  (4, 3, 1), (5, 3, 1), (6, 4, 1), (7, 3, 1);

insert into approvals (repair_id, title, note, price) values
  (1, 'Replace front pads and rotors', 'Front pads are down to 2 mm and the rotors are scored.', 322.00);

-- Totals include 7% tax
insert into transactions (repair_id, date, amount, status) values
  (5, '2026-09-08', 161.46, 'Paid'),
  (6, '2026-07-02', 190.41, 'Paid'),
  (7, '2026-11-08',  97.32, 'Paid');
