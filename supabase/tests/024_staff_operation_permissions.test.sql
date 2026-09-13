begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();
create function pg_temp.affected(p_sql text) returns integer language plpgsql as $$
declare v_count integer;
begin execute p_sql; get diagnostics v_count=row_count; return v_count; end;
$$;
insert into auth.users(id,raw_user_meta_data) values
 ('24000000-0000-4000-8000-000000000001','{"role":"venue_owner"}'),
 ('24000000-0000-4000-8000-000000000002','{}'),
 ('24000000-0000-4000-8000-000000000003','{}'),
 ('24000000-0000-4000-8000-000000000004','{}'),
 ('24000000-0000-4000-8000-000000000005','{}');
update profiles set role='admin' where id='24000000-0000-4000-8000-000000000005';
insert into sports(id,name,slug) values('24000000-0000-4000-8000-000000000020','Staff Sport','staff-sport-024');
insert into venues(id,owner_id,name,slug,city,district,status) values
 ('24000000-0000-4000-8000-000000000010','24000000-0000-4000-8000-000000000001','Staff Venue','staff-venue-024','İstanbul','Test','approved'),
 ('24000000-0000-4000-8000-000000000011','24000000-0000-4000-8000-000000000001','Other Venue','staff-other-024','İstanbul','Test','approved');
insert into courts(id,venue_id,sport_id,name) values
 ('24000000-0000-4000-8000-000000000030','24000000-0000-4000-8000-000000000010','24000000-0000-4000-8000-000000000020','Court');
insert into opening_hours(venue_id,day_of_week,open_time,close_time)
 select '24000000-0000-4000-8000-000000000010',d,'08:00','23:00' from generate_series(0,6) d;
insert into price_rules(court_id,start_time,end_time,price) values('24000000-0000-4000-8000-000000000030','08:00','23:00',1000);
insert into venue_staff(venue_id,user_id,role) values
 ('24000000-0000-4000-8000-000000000010','24000000-0000-4000-8000-000000000002','manager'),
 ('24000000-0000-4000-8000-000000000010','24000000-0000-4000-8000-000000000003','reception'),
 ('24000000-0000-4000-8000-000000000010','24000000-0000-4000-8000-000000000004','viewer');
select set_config('request.jwt.claim.sub','24000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select is((select count(*)::int from list_panel_venues()),1,'Reception sees only assigned panel venue');
select lives_ok($$insert into reservations(id,court_id,venue_id,reservation_date,start_time,end_time,guest_name,guest_phone,notes)
 values('24000000-0000-4000-8000-000000000040','24000000-0000-4000-8000-000000000030','24000000-0000-4000-8000-000000000010',current_date+1,'08:00','09:00','Staff Guest','05551112233','Private note')$$,
 'Reception creates manual booking using real validation triggers');
select is((select total_price from reservations where id='24000000-0000-4000-8000-000000000040'),1000::numeric,'Server calculates price');
select is((select created_by from reservations where id='24000000-0000-4000-8000-000000000040'),auth.uid(),'Actor recorded');
select is(jsonb_array_length(search_venue_customers('24000000-0000-4000-8000-000000000010')),1,'Reception can search linked contact');
select throws_ok($$select search_venue_customers('24000000-0000-4000-8000-000000000011')$$,
 'P0001','Müşteri arama yetkiniz yok','Other venue customer data denied');
select throws_ok($$insert into price_rules(court_id,start_time,end_time,price) values('24000000-0000-4000-8000-000000000030','08:00','09:00',5)$$,
 '42501',null,'Reception cannot create prices');
select is(pg_temp.affected($$update venues set name='Forbidden' where id='24000000-0000-4000-8000-000000000010'$$),0,'Reception cannot edit venue');
select set_config('request.jwt.claim.sub','24000000-0000-4000-8000-000000000004',true);
select is((select count(*)::int from reservations),0,'Viewer cannot read raw reservations');
select is((select count(*)::int from venue_customers),0,'Viewer cannot read customer directory');
select is((select guest_name from get_panel_schedule('24000000-0000-4000-8000-000000000010',current_date+1)),'Dolu','Viewer sees occupancy label');
select ok((select guest_phone is null and notes is null and profiles is null from get_panel_schedule('24000000-0000-4000-8000-000000000010',current_date+1)),'Viewer receives no contact details');
select throws_ok($$insert into reservations(court_id,reservation_date,start_time,end_time,guest_name) values('24000000-0000-4000-8000-000000000030',current_date+1,'09:00','10:00','Forbidden')$$,
 'P0001','Manuel rezervasyon yetkiniz yok','Viewer cannot create manual booking');
select is(pg_temp.affected($$update reservations set status='cancelled' where id='24000000-0000-4000-8000-000000000040'$$),0,'Viewer cannot mutate booking');
select throws_ok($$select * from get_panel_schedule('24000000-0000-4000-8000-000000000011',current_date+1)$$,
 'P0001','Bu tesisin takvimini görme yetkiniz yok','Other venue calendar denied');
select set_config('request.jwt.claim.sub','24000000-0000-4000-8000-000000000002',true);
select is(pg_temp.affected($$update venues set name='Managed' where id='24000000-0000-4000-8000-000000000010'$$),1,'Manager can update assigned venue');
select throws_ok($$update venues set owner_id=auth.uid() where id='24000000-0000-4000-8000-000000000010'$$,
 'P0001','Tesis sahipliği ve kimliği değiştirilemez','Manager cannot take ownership');
select lives_ok($$update price_rules set price=1200 where court_id='24000000-0000-4000-8000-000000000030'$$,'Manager updates prices');
select lives_ok($$update reservations set status='cancelled' where id='24000000-0000-4000-8000-000000000040'$$,'Manager cancels booking through state machine');
select set_config('request.jwt.claim.sub','24000000-0000-4000-8000-000000000005',true);
select ok(has_venue_permission('24000000-0000-4000-8000-000000000011','staff.manage'),'Admin can manage venue staff');
reset role;
delete from venue_staff where user_id='24000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','24000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*)::int from list_panel_venues()),0,'Removed manager loses panel scope');
select is(pg_temp.affected($$update venues set name='Forbidden' where id='24000000-0000-4000-8000-000000000010'$$),0,'Removed manager cannot edit with old session');
reset role;
select * from finish();
rollback;
