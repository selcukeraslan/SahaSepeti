create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(3);

select has_function(
  'public',
  'create_marketplace_reservation',
  array['uuid','uuid','date','time without time zone','time without time zone','numeric','text','uuid'],
  'Rezervasyon fiyat teklif RPCsi vardır'
);
select ok(
  pg_get_functiondef('public.create_marketplace_reservation(uuid,uuid,date,time,time,numeric,text,uuid)'::regprocedure)
    ilike '%P0002%',
  'Fiyat değişikliğinde özel hata döner'
);
select ok(
  pg_get_functiondef('public.create_marketplace_reservation(uuid,uuid,date,time,time,numeric,text,uuid)'::regprocedure)
    ilike '%returning * into v_reservation%',
  'Kontrol trigger sonrası oluşan nihai fiyat üzerinden yapılır'
);

select * from finish();
