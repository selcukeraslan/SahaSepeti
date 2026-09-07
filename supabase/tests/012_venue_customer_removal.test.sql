begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select plan(22);
select is(normalize_customer_phone('0555 123 45 67'),'+905551234567','Başında sıfır normalize edilir');
select is(normalize_customer_phone('+90 (555) 123-45-67'),'+905551234567','Ülke kodu ve ayraçlar normalize edilir');
select is(normalize_customer_phone('00905551234567'),'+905551234567','0090 biçimi normalize edilir');
select is(normalize_customer_phone('5551234567'),'+905551234567','On hane normalize edilir');
select is(normalize_customer_phone('abc05551234567'),null::text,'Harf içeren telefon reddedilir');

insert into auth.users(id,email,raw_user_meta_data) values
 ('16000000-0000-4000-8000-000000000001','directory-owner@example.test','{"full_name":"Directory Owner","role":"venue_owner"}'),
 ('16000000-0000-4000-8000-000000000002','directory-other@example.test','{"full_name":"Other Owner","role":"venue_owner"}');
insert into sports(id,name,slug) values ('16000000-0000-4000-8000-000000000003','Directory Test','directory-test-16');
insert into venues(id,owner_id,name,slug,city,district,status) values
 ('16000000-0000-4000-8000-000000000004','16000000-0000-4000-8000-000000000001','Directory Test','directory-test-16','İstanbul','Test','approved');
insert into courts(id,venue_id,sport_id,name) values
 ('16000000-0000-4000-8000-000000000005','16000000-0000-4000-8000-000000000004','16000000-0000-4000-8000-000000000003','Court');
insert into opening_hours(venue_id,day_of_week,open_time,close_time)
 select '16000000-0000-4000-8000-000000000004',d,'08:00','23:00' from generate_series(0,6)d;
insert into price_rules(court_id,start_time,end_time,price) values
 ('16000000-0000-4000-8000-000000000005','08:00','23:00',1000);

select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select save_venue_customer('{"action":"create","venueId":"16000000-0000-4000-8000-000000000004","name":"Test Customer","phone":"05551234567"}');
select save_venue_customer('{"action":"create","venueId":"16000000-0000-4000-8000-000000000004","name":"Duplicate","phone":"+90 (555) 123 45 67"}');
select is((select count(*)::int from venue_customers where venue_id='16000000-0000-4000-8000-000000000004'),1,'Tek telefon tek kayıt');
select is(jsonb_array_length(search_venue_customers('16000000-0000-4000-8000-000000000004','4567')),1,'Son dört haneyle arama');
select is(jsonb_array_length(search_venue_customers('16000000-0000-4000-8000-000000000004','Test Customer')),1,'Adla arama');

insert into reservations(court_id,reservation_date,start_time,end_time,venue_customer_id)
 select '16000000-0000-4000-8000-000000000005',current_date+14,'20:00','21:00',id
 from venue_customers where venue_id='16000000-0000-4000-8000-000000000004';
select is((select guest_phone from reservations where court_id='16000000-0000-4000-8000-000000000005'),'+905551234567','Seçilen müşterinin telefonu sunucuda doldurulur');
select is((search_venue_customers('16000000-0000-4000-8000-000000000004')->0->>'total_count'),'1','Rezervasyon toplamı güncel');
select save_venue_customer(jsonb_build_object('action','blacklist','id',id,'blocked',true,'reason','Test gerekçesi'))
 from venue_customers where venue_id='16000000-0000-4000-8000-000000000004';
select throws_ok($$insert into reservations(court_id,reservation_date,start_time,end_time,guest_name,guest_phone)
 values('16000000-0000-4000-8000-000000000005',current_date+14,'21:00','22:00','Yeni ad','5551234567')$$,
 'P0001','Müşteri kara listede; yeni rezervasyon oluşturulamaz','Telefonla yeniden girerek kara liste aşılamaz');
select is((select count(*)::int from reservations where court_id='16000000-0000-4000-8000-000000000005'),1,'Kara liste mevcut kaydı iptal etmez');

select set_config('test.deleted_customer_id',(select id::text from venue_customers where venue_id='16000000-0000-4000-8000-000000000004'),true);
select delete_venue_customer(current_setting('test.deleted_customer_id')::uuid);
select is(jsonb_array_length(search_venue_customers('16000000-0000-4000-8000-000000000004')),0,'Silinen müşteri aramada yok');
select is((select count(*)::int from reservations where venue_customer_id=current_setting('test.deleted_customer_id')::uuid),1,'Silme rezervasyonu korur');
select save_venue_customer('{"action":"create","venueId":"16000000-0000-4000-8000-000000000004","name":"Yeni ad","phone":"05551234567"}');
select is((search_venue_customers('16000000-0000-4000-8000-000000000004')->0->>'id'),current_setting('test.deleted_customer_id'),'Tekrar ekleme aynı kaydı açar');
select ok((select is_blacklisted from venue_customers where id=current_setting('test.deleted_customer_id')::uuid),'Kara liste silip ekleyerek aşılamaz');
select is((select count(*)::int from venue_customers where venue_id='16000000-0000-4000-8000-000000000004'),1,'Tekrar ekleme mükerrer üretmez');
select ok(not has_function_privilege('authenticated','public.save_venue_customer_internal(jsonb)','EXECUTE'),'İç fonksiyon dışarıya kapalı');

select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000002',true);
select throws_ok($select delete_venue_customer(current_setting('test.deleted_customer_id')::uuid)$,
 'P0001','Müşteri silme yetkiniz yok','Diğer owner silemez');
select is((select count(*)::int from venue_customers where venue_id='16000000-0000-4000-8000-000000000004'),0,'Diğer owner müşteri okuyamaz');
select throws_ok($$select search_venue_customers('16000000-0000-4000-8000-000000000004')$$,
 'P0001','Müşteri arama yetkiniz yok','Diğer owner RPC ile arayamaz');
select throws_ok($$select save_venue_customer('{"action":"create","venueId":"16000000-0000-4000-8000-000000000004","name":"Yetkisiz","phone":"05551234567"}')$$,
 'P0001','Müşteri yönetme yetkiniz yok','Diğer owner müşteri yazamaz');
reset role;
select * from finish();
rollback;
