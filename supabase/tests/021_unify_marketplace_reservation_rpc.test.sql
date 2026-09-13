begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(9);
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

create function pg_temp.price_detail() returns jsonb language plpgsql as $$
declare v_detail text;
begin
  perform create_marketplace_reservation('14000000-0000-4000-8000-000000000005',
    '14000000-0000-4000-8000-000000000004',current_date+1,'08:00','09:00',1,null);
  return null;
exception when sqlstate 'P0002' then
  get stacked diagnostics v_detail = pg_exception_detail;
  return v_detail::jsonb;
end;
$$;
select is((pg_temp.price_detail()->>'currentTotalPrice')::numeric,1000::numeric,'Güncel sunucu tutarı hata detayında döner');
select is((select count(*)::int from reservations where customer_id=auth.uid()),0,'Fiyat uyuşmazlığı kayıt bırakmaz');
select is(create_marketplace_reservation('14000000-0000-4000-8000-000000000005',
 '14000000-0000-4000-8000-000000000004',current_date+1,'08:00','09:00',1000,null)->>'status','pending','Yeni tutarla ikinci onay başarılı');
select is((select count(*)::int from reservations where customer_id=auth.uid()),1,'Yalnızca bir rezervasyon oluşur');

select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='create_marketplace_reservation'),1,'Tek RPC imzası kalır');
select create_marketplace_reservation('14000000-0000-4000-8000-000000000005',
 '14000000-0000-4000-8000-000000000004',current_date+2,'08:00','09:00',1000,null,
 '21000000-0000-4000-8000-000000000001');
select is(create_marketplace_reservation('14000000-0000-4000-8000-000000000005',
 '14000000-0000-4000-8000-000000000004',current_date+2,'08:00','09:00',1000,null,
 '21000000-0000-4000-8000-000000000001')->>'id',
 (select id::text from reservations where client_request_id='21000000-0000-4000-8000-000000000001'),
 'Tekrar aynı rezervasyonu döndürür');
select is((select count(*)::int from reservations where customer_id=auth.uid()),2,'Tekrar yeni kayıt üretmez');
select throws_ok($select create_marketplace_reservation('14000000-0000-4000-8000-000000000005',
 '14000000-0000-4000-8000-000000000004',current_date+3,'08:00','09:00',1000,null,
 '21000000-0000-4000-8000-000000000001')$,
 'P0001','İstek kimliği farklı bir rezervasyon için kullanılmış','Aynı anahtar başka slot için kullanılamaz');
select throws_ok($update reservations set client_request_id=null
 where client_request_id='21000000-0000-4000-8000-000000000001'$,
 'P0001','Rezervasyon istek kimliği değiştirilemez','İstek kimliği korunur');

reset role;
select * from finish();
rollback;
