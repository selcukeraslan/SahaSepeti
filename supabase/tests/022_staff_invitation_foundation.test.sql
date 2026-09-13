begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('22000000-0000-4000-8000-000000000001','owner@staff.test',now(),'{"role":"venue_owner"}'),
 ('22000000-0000-4000-8000-000000000002','manager@staff.test',now(),'{}'),
 ('22000000-0000-4000-8000-000000000003','viewer@staff.test',now(),'{}'),
 ('22000000-0000-4000-8000-000000000004','other@staff.test',now(),'{"role":"venue_owner"}');
insert into venues(id,owner_id,name,slug,city,district,status) values
 ('22000000-0000-4000-8000-000000000010','22000000-0000-4000-8000-000000000001','Staff Test','staff-test-022','İstanbul','Test','approved'),
 ('22000000-0000-4000-8000-000000000011','22000000-0000-4000-8000-000000000004','Other Test','staff-other-022','İstanbul','Test','approved');
create temporary table staff_test_invites (result jsonb);
grant select,insert,delete on staff_test_invites to authenticated;
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select ok(has_venue_permission('22000000-0000-4000-8000-000000000010','staff.manage'),'Owner manages staff');
select ok(not has_venue_permission('22000000-0000-4000-8000-000000000011','staff.manage'),'Other venue isolated');
select ok(not has_venue_permission('22000000-0000-4000-8000-000000000010','unknown'),'Unknown permission denied');
insert into staff_test_invites select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"manager@staff.test","role":"manager"}');
select is((select length(result->>'token') from staff_test_invites),64,'Link contains a random token');
select throws_ok($$select token_hash from staff_invites$$,'42501',null,'Browser cannot read token hashes');
select throws_ok($$insert into venue_staff(venue_id,user_id,role) values('22000000-0000-4000-8000-000000000010','22000000-0000-4000-8000-000000000003','manager')$$,'42501',null,'Direct membership writes denied');
select throws_ok($$select accept_staff_invite((select result->>'token' from staff_test_invites))$$,
 'P0001','Davet edilen doğrulanmış e-posta hesabıyla giriş yapın','Wrong account cannot accept');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000002',true);
select is(accept_staff_invite((select result->>'token' from staff_test_invites)),
 '22000000-0000-4000-8000-000000000010'::uuid,'Intended account accepts');
select throws_ok($$select accept_staff_invite((select result->>'token' from staff_test_invites))$$,
 'P0001','Davet geçersiz veya süresi dolmuş','Used token denied');
select is((select role::text from profiles where id=auth.uid()),'customer','Global account role unchanged');
select ok(not owns_venue('22000000-0000-4000-8000-000000000010'),'Manager is not owner');
select ok(has_venue_permission('22000000-0000-4000-8000-000000000010','staff.manage'),'Manager has scoped management permission');
select throws_ok($$select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"viewer@staff.test","role":"manager"}')$$,
 'P0001','Yönetici rolünü yalnızca tesis sahibi veya admin atayabilir','Manager cannot promote peers');
delete from staff_test_invites;
insert into staff_test_invites select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"viewer@staff.test","role":"viewer"}');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
select is(accept_staff_invite((select result->>'token' from staff_test_invites)),
 '22000000-0000-4000-8000-000000000010'::uuid,'Manager can invite a viewer');
select ok(has_venue_permission('22000000-0000-4000-8000-000000000010','calendar.read'),'Viewer read permission');
select ok(not has_venue_permission('22000000-0000-4000-8000-000000000010','reservations.write'),'Viewer cannot write reservations');
select is((select count(*)::int from venue_staff),1,'Viewer sees only own membership');
select is((select count(id)::int from staff_invites),0,'Viewer cannot read invitations');
select throws_ok($$select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"other@staff.test","role":"viewer"}')$$,
 'P0001','Personel yönetimi için yetkiniz yok','Viewer cannot invite');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
select manage_venue_staff(jsonb_build_object('action','remove','venueId','22000000-0000-4000-8000-000000000010',
 'id',(select id from venue_staff where user_id='22000000-0000-4000-8000-000000000003')));
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
select ok(not has_venue_permission('22000000-0000-4000-8000-000000000010','calendar.read'),'Removal invalidates permission immediately');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
delete from staff_test_invites;
insert into staff_test_invites select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"viewer@staff.test","role":"reception"}');
select manage_venue_staff(jsonb_build_object('action','revoke_invite','venueId','22000000-0000-4000-8000-000000000010',
 'id',(select result->>'id' from staff_test_invites)));
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
select throws_ok($$select accept_staff_invite((select result->>'token' from staff_test_invites))$$,
 'P0001','Davet geçersiz veya süresi dolmuş','Revoked token denied');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
delete from staff_test_invites;
insert into staff_test_invites select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"viewer@staff.test","role":"reception"}');
reset role;
update staff_invites set created_at=now()-interval '8 days', expires_at=now()-interval '1 day'
 where id=(select (result->>'id')::uuid from staff_test_invites);
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$select accept_staff_invite((select result->>'token' from staff_test_invites))$$,
 'P0001','Davet geçersiz veya süresi dolmuş','Expired token denied');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000002',true);
delete from staff_test_invites;
insert into staff_test_invites select manage_venue_staff('{"action":"invite","venueId":"22000000-0000-4000-8000-000000000010","email":"viewer@staff.test","role":"reception"}');
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000001',true);
select manage_venue_staff(jsonb_build_object('action','remove','venueId','22000000-0000-4000-8000-000000000010',
 'id',(select id from venue_staff where user_id='22000000-0000-4000-8000-000000000002')));
select set_config('request.jwt.claim.sub','22000000-0000-4000-8000-000000000003',true);
select throws_ok($$select accept_staff_invite((select result->>'token' from staff_test_invites))$$,
 'P0001','Davet geçersiz veya süresi dolmuş','Removed manager invitations revoked');
reset role;
select * from finish();
rollback;
