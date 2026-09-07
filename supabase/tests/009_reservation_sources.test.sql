-- 009 uygulandıktan sonra pgTAP ile çalıştırılır. Tüm kayıtlar rollback edilir.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(13);

select col_not_null('public', 'reservations', 'source', 'Her rezervasyonun kaynağı zorunludur');
select has_index('public', 'reservations', 'idx_reservations_external_identity', 'Dış kimlik unique indexi vardır');
select ok((select relrowsecurity from pg_class where oid = 'public.reservations'::regclass),
  'Rezervasyon RLS koruması açıktır');

-- Yalnızca kaynak trigger davranışını izole eder. Gerçek tablo RLS ve fiyat/durum
-- zinciri ayrıca entegrasyon testinde doğrulanmalıdır; bu test onun yerine geçmez.
create temporary table source_fixture (like public.reservations including defaults);
create trigger source_guard before insert or update on source_fixture
  for each row execute function public.guard_reservation_source();

insert into source_fixture (court_id, venue_id, customer_id, reservation_date, start_time, end_time, source)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003', current_date + 1, '10:00', '11:00', 'manual');
select is((select source::text from source_fixture where start_time = '10:00'), 'marketplace',
  'Müşteri kaydında sahte manual kaynağı normalize edilir');

insert into source_fixture (court_id, venue_id, reservation_date, start_time, end_time, guest_name, guest_reference)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  current_date + 1, '11:00', '12:00', 'Test Misafir', '10000000-0000-0000-0000-000000000099');
select is((select source::text from source_fixture where start_time = '11:00'), 'manual',
  'Müşterisiz misafir kaydı manual olur');
select ok((select guest_reference is not null
  and guest_reference <> '10000000-0000-0000-0000-000000000099'::uuid
  from source_fixture where start_time = '11:00'), 'Misafir referansı sunucuda üretilir');

insert into source_fixture (court_id, venue_id, reservation_date, start_time, end_time, is_block)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  current_date + 1, '12:00', '13:00', true);
select is((select source::text from source_fixture where start_time = '12:00'), 'block', 'Blok kaynağı otomatik atanır');
select ok((select guest_reference is null from source_fixture where start_time = '12:00'), 'Bloğa misafir referansı verilmez');

select throws_ok($$update source_fixture set source = 'manual' where start_time = '10:00'$$,
  'P0001', 'Rezervasyon kaynağı ve referansları değiştirilemez', 'Kaynak sonradan değiştirilemez');
select throws_ok($$update source_fixture set guest_reference = gen_random_uuid() where start_time = '11:00'$$,
  'P0001', 'Rezervasyon kaynağı ve referansları değiştirilemez', 'Misafir referansı değiştirilemez');
select throws_ok($$update source_fixture set external_provider = 'fake' where start_time = '10:00'$$,
  'P0001', 'Rezervasyon kaynağı ve referansları değiştirilemez', 'Sonradan dış kaynak bilgisi eklenemez');
select throws_ok($$insert into source_fixture (court_id, venue_id, reservation_date, start_time, end_time, source)
  values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
  current_date + 1, '13:00', '14:00', 'external')$$,
  'P0001', 'Dış sistem rezervasyonları henüz kullanıma açık değil', 'Sahte dış kaynak kabul edilmez');
select lives_ok($$update source_fixture set status = 'cancelled' where start_time = '10:00'$$,
  'Kaynak koruması normal durum güncellemesini engellemez');

select * from finish();
rollback;
