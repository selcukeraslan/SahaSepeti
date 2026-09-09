begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(6);

select has_function('public', 'guard_reservation_limits', array[]::text[], 'Rezervasyon limit trigger fonksiyonu vardır');
select ok(pg_get_functiondef('public.guard_reservation_limits()'::regprocedure)
  ilike '%pg_advisory_xact_lock%', 'Kota kontrolü paralel istekleri serileştirir');
select ok(pg_get_functiondef('public.guard_reservation_limits()'::regprocedure)
  ilike '%30 gün%', 'Rezervasyon ufku 30 gündür');
select ok(pg_get_functiondef('public.guard_reservation_limits()'::regprocedure)
  ilike '%v_pending_count >= 3%', 'Bekleyen rezervasyon kotası üçtür');

insert into auth.users(id, raw_user_meta_data) values
  ('14000000-0000-4000-8000-000000000001', '{"role":"venue_owner"}'),
  ('14000000-0000-4000-8000-000000000002', '{}');
insert into sports(id, name, slug) values
  ('14000000-0000-4000-8000-000000000003', 'Limit Sport', 'limit-sport');
insert into venues(id, owner_id, name, slug, city, district, status) values
  ('14000000-0000-4000-8000-000000000004', '14000000-0000-4000-8000-000000000001', 'Limit Venue', 'limit-venue', 'İstanbul', 'Test', 'approved');
insert into courts(id, venue_id, sport_id, name) values
  ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', '14000000-0000-4000-8000-000000000003', 'Court');
insert into opening_hours(venue_id, day_of_week, open_time, close_time)
  select '14000000-0000-4000-8000-000000000004', d, '08:00', '23:00' from generate_series(0, 6) d;
insert into price_rules(court_id, start_time, end_time, price)
  values ('14000000-0000-4000-8000-000000000005', '08:00', '23:00', 1000);

select set_config('request.jwt.claim.sub', '14000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select throws_ok($$insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time)
  values ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', auth.uid(), current_date + 31, '08:00', '09:00')$$,
  'P0001', 'Rezervasyonlar en fazla 30 gün öncesinden yapılabilir', '31 gün sonrası reddedilir');
insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time)
  values
    ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', auth.uid(), current_date + 1, '08:00', '09:00'),
    ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', auth.uid(), current_date + 2, '08:00', '09:00'),
    ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', auth.uid(), current_date + 3, '08:00', '09:00');
select is((select count(*)::int from reservations where customer_id = auth.uid() and status = 'pending'), 3,
  'İlk üç bekleyen rezervasyon kabul edilir');
select throws_ok($$insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time)
  values ('14000000-0000-4000-8000-000000000005', '14000000-0000-4000-8000-000000000004', auth.uid(), current_date + 4, '08:00', '09:00')$$,
  'P0001', 'Aynı anda en fazla 3 bekleyen rezervasyonunuz olabilir', 'Dördüncü bekleyen rezervasyon reddedilir');

reset role;
select * from finish();
rollback;
