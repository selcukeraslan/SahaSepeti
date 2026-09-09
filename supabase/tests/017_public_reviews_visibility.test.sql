create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(2);

select has_function('public', 'get_venue_reviews', array['uuid'], 'Public yorum RPCsi vardır');
select ok(
  pg_get_functiondef('public.get_venue_reviews(uuid)'::regprocedure)
    ilike '%v.status = ''approved'' or v.owner_id = auth.uid() or public.is_admin()%',
  'Yorum görünürlüğü tesis durumu ve yetkili kullanıcıyla sınırlandırılır'
);

select * from finish();
