-- Geliştirme DB: 001–010 uygulandıktan sonra pgTAP ile çalıştırılır.
-- Gerçek tablolar/trigger/RLS zinciri; fixture ve bütün değişiklikler rollback edilir.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(15);

insert into auth.users(id,email,raw_user_meta_data) values
 ('15000000-0000-4000-8000-000000000001','series-owner@example.test','{"full_name":"Series Owner"}'),
 ('15000000-0000-4000-8000-000000000002','series-other@example.test','{"full_name":"Other Owner"}');
update profiles set role = 'venue_owner' where id in
 ('15000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002');
insert into sports(id,name,slug) values ('15000000-0000-4000-8000-000000000003','Series Test','series-test-15');
insert into venues(id,owner_id,name,slug,city,district,status)
 values ('15000000-0000-4000-8000-000000000004','15000000-0000-4000-8000-000000000001',
 'Series Test','series-test-15','İstanbul','Test','approved');
insert into courts(id,venue_id,sport_id,name) values
 ('15000000-0000-4000-8000-000000000005','15000000-0000-4000-8000-000000000004',
 '15000000-0000-4000-8000-000000000003','Test Court');
insert into opening_hours(venue_id,day_of_week,open_time,close_time)
 select '15000000-0000-4000-8000-000000000004',d,'08:00','23:00' from generate_series(0,6) d;
insert into price_rules(court_id,start_time,end_time,price) values
 ('15000000-0000-4000-8000-000000000005','08:00','23:00',1250);

create temp table series_test_results(label text, result jsonb);
grant all on series_test_results to authenticated;
select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000001',true);
set local role authenticated;

insert into series_test_results values ('preview',manage_reservation_series(jsonb_build_object(
 'action','create','courtId','15000000-0000-4000-8000-000000000005','name','Test Series',
 'guestName','Test Guest','date',current_date+14,'startTime','20:00','endTime','21:00','weeks',4),true));
select is((select result->>'valid' from series_test_results where label='preview'),'true','Önizleme başarılı');
select is((select count(*)::int from reservation_series),0,'Önizleme seri bırakmaz');
select is((select count(*)::int from reservations where court_id='15000000-0000-4000-8000-000000000005'),0,'Önizleme rezervasyon bırakmaz');

insert into series_test_results values ('create',manage_reservation_series(jsonb_build_object(
 'action','create','courtId','15000000-0000-4000-8000-000000000005','name','Test Series',
 'guestName','Test Guest','date',current_date+14,'startTime','20:00','endTime','21:00','weeks',4),false));
select is((select result->>'saved' from series_test_results where label='create'),'true','Seri kaydedilir');
select is((select count(*)::int from reservations where court_id='15000000-0000-4000-8000-000000000005'),4,'Dört hafta oluşur');
select ok((select bool_and(source='manual' and total_price=1250 and created_by=auth.uid()) from reservations
 where court_id='15000000-0000-4000-8000-000000000005'),'Kaynak, fiyat ve aktör sunucudan gelir');

insert into series_test_results values ('conflict',manage_reservation_series(jsonb_build_object(
 'action','create','courtId','15000000-0000-4000-8000-000000000005','name','Conflict Series',
 'guestName','Test Guest','date',current_date+7,'startTime','20:00','endTime','21:00','weeks',4),false));
select is((select result->>'saved' from series_test_results where label='conflict'),'false','Çakışan seri kaydedilmez');
select is((select count(*)::int from reservations where court_id='15000000-0000-4000-8000-000000000005'),4,'Çakışmada uygun ilk hafta da geri alınır');
select is((select count(*)::int from reservation_series),1,'Başarısız seri başlığı da geri alınır');

insert into series_test_results values ('update',manage_reservation_series(jsonb_build_object(
 'action','update','reservationId',(select id from reservations where court_id='15000000-0000-4000-8000-000000000005'
 and reservation_date=current_date+14),'scope','one','startTime','21:00','endTime','22:00'),false));
select is((select result->>'saved' from series_test_results where label='update'),'true','Tek hafta saati değişir');
select is((select count(*)::int from reservations where court_id='15000000-0000-4000-8000-000000000005' and status='confirmed'),4,'Dört aktif hafta korunur');
select is((select count(*)::int from reservations where court_id='15000000-0000-4000-8000-000000000005' and series_superseded),1,'Eski saat geçmişte korunur');

insert into series_test_results values ('cancel',manage_reservation_series(jsonb_build_object(
 'action','cancel','reservationId',(select id from reservations where court_id='15000000-0000-4000-8000-000000000005'
 and reservation_date=current_date+21),'scope','following'),false));
select is((select result->>'count' from series_test_results where label='cancel'),'3','Bu ve sonrası üç haftayı kapsar');

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from reservation_series),0,'Başka owner seriyi okuyamaz');
select throws_ok($$select manage_reservation_series(jsonb_build_object('action','create',
 'courtId','15000000-0000-4000-8000-000000000005'),false)$$,
 'P0001','Bu tesiste seri yönetme yetkiniz yok','Başka owner seri yazamaz');
reset role;
select * from finish();
rollback;
