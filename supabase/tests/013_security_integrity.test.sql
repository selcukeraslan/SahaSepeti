begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(11);

select has_function('public', 'guard_court_venue_change', array[]::text[], 'Saha tesis bağlantısı trigger fonksiyonu vardır');
select has_function('public', 'guard_venue_delete', array[]::text[], 'Tesis silme koruması vardır');
select has_function('public', 'guard_review_integrity', array[]::text[], 'Yorum bütünlüğü trigger fonksiyonu vardır');
select ok(pg_get_functiondef('public.guard_venue_status()'::regprocedure)
  ilike '%old.status = ''approved''%', 'Approved tesis owner tarafından draft yapılamaz');
select ok(pg_get_constraintdef(oid) ilike '%length(notes) <= 500%'
  from pg_constraint where conname = 'reservations_notes_length', 'Rezervasyon notu DB tarafında sınırlıdır');

insert into auth.users(id, email, raw_user_meta_data) values
  ('13000000-0000-4000-8000-000000000001', 'integrity-owner@example.test', '{"role":"venue_owner"}'),
  ('13000000-0000-4000-8000-000000000002', 'integrity-customer@example.test', '{}');
insert into sports(id, name, slug) values
  ('13000000-0000-4000-8000-000000000003', 'Integrity Sport', 'integrity-sport');
insert into venues(id, owner_id, name, slug, city, district, status) values
  ('13000000-0000-4000-8000-000000000004', '13000000-0000-4000-8000-000000000001', 'Integrity A', 'integrity-a', 'İstanbul', 'Test', 'approved'),
  ('13000000-0000-4000-8000-000000000005', '13000000-0000-4000-8000-000000000001', 'Integrity B', 'integrity-b', 'İstanbul', 'Test', 'approved');
insert into courts(id, venue_id, sport_id, name) values
  ('13000000-0000-4000-8000-000000000006', '13000000-0000-4000-8000-000000000004', '13000000-0000-4000-8000-000000000003', 'Court');
insert into opening_hours(venue_id, day_of_week, open_time, close_time)
  select '13000000-0000-4000-8000-000000000004', d, '08:00', '23:00' from generate_series(0, 6) d;
insert into price_rules(court_id, start_time, end_time, price)
  values ('13000000-0000-4000-8000-000000000006', '08:00', '23:00', 1000);

-- Test fixture is inserted as the trusted database role so the review tests
-- can focus on UPDATE integrity rather than the owner/customer state machine.
insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time, status)
  values ('13000000-0000-4000-8000-000000000006', '13000000-0000-4000-8000-000000000004',
    '13000000-0000-4000-8000-000000000002', current_date + 1, '08:00', '09:00', 'completed');

select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select throws_ok($$update courts set venue_id = '13000000-0000-4000-8000-000000000005'
  where id = '13000000-0000-4000-8000-000000000006'$$,
  'P0001', 'Sahanın bağlı olduğu tesis değiştirilemez', 'Owner saha taşıyamaz');
select throws_ok($$update venues set status = 'draft'
  where id = '13000000-0000-4000-8000-000000000004'$$,
  'P0001', 'Bu durum geçişi yalnızca admin tarafından yapılabilir', 'Owner approved tesisi draft yapamaz');
insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time)
  values ('13000000-0000-4000-8000-000000000006', '13000000-0000-4000-8000-000000000004',
    '13000000-0000-4000-8000-000000000002', current_date + 1, '08:00', '09:00');
select throws_ok($$insert into reservations(court_id, venue_id, customer_id, reservation_date, start_time, end_time, notes)
  values ('13000000-0000-4000-8000-000000000006', '13000000-0000-4000-8000-000000000004',
    '13000000-0000-4000-8000-000000000001', current_date + 10, '09:00', '10:00', repeat('x', 501))$$,
  '23514', null, 'Data API ile uzun not yazılamaz');
select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000002', true);
select lives_ok($$insert into reviews(venue_id, customer_id, reservation_id, rating, comment)
  select venue_id, customer_id, id, 5, 'Test' from reservations where customer_id = auth.uid()$$,
  'Tamamlanmış rezervasyonu olan müşteri yorum yazabilir');
select throws_ok($$update reviews set venue_id = '13000000-0000-4000-8000-000000000005'$$,
  'P0001', 'Yorumun müşteri, tesis ve rezervasyon bağlantısı değiştirilemez', 'Yorum başka tesise taşınamaz');
select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000001', true);
select throws_ok($$delete from venues where id = '13000000-0000-4000-8000-000000000004'$$,
  'P0001', 'Rezervasyon geçmişi olan tesis silinemez; askıya alınmalıdır', 'Rezervasyon geçmişi olan tesis silinemez');

reset role;
select * from finish();
rollback;
