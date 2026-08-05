-- Supabase CLI: `supabase start && supabase test db`
-- Migration'ın güvenlik sözleşmesini gerçek Postgres katalogları üzerinden doğrular.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews: herkese açık'
  ),
  'ham reviews tablosu herkese açık değildir'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews: müşteri kendi yorumunu görür'
  ),
  'müşteri yalnızca kendi ham yorumunu okuyabilir'
);

select has_function(
  'public',
  'get_venue_rating_summaries',
  array['uuid[]'],
  'kişisel veri içermeyen puan özeti RPC''si vardır'
);

select function_returns(
  'public',
  'get_venue_rating_summaries',
  array['uuid[]'],
  'setof record',
  'puan özeti RPC''si tablo kaydı döndürür'
);

select ok(
  pg_get_functiondef('public.validate_reservation()'::regprocedure)
    ilike '%rezervasyon süresi tam 1 saat olmalı%',
  'insert trigger tam bir saatlik slotu zorunlu kılar'
);

select ok(
  pg_get_functiondef('public.validate_reservation()'::regprocedure)
    ilike '%çalışma saatleri dışında%',
  'insert trigger çalışma saatini doğrular'
);

select ok(
  pg_get_functiondef('public.validate_reservation()'::regprocedure)
    ilike '%rezervasyon başlangıcı geçerli bir slot değil%',
  'insert trigger slot hizasını doğrular'
);

select ok(
  pg_get_functiondef('public.validate_reservation()'::regprocedure)
    ilike '%new.no_show = false%',
  'istemci insert sırasında no-show değerini belirleyemez'
);

select ok(
  pg_get_functiondef('public.validate_reservation()'::regprocedure)
    ilike '%new.created_by = auth.uid()%',
  'created_by gerçek oturum kimliğinden türetilir'
);

select ok(
  pg_get_functiondef('public.guard_reservation_update()'::regprocedure)
    ilike '%geçersiz rezervasyon durum geçişi%',
  'update trigger durum makinesini uygular'
);

select ok(
  pg_get_functiondef('public.guard_reservation_update()'::regprocedure)
    ilike '%gelecekteki rezervasyon tamamlandı%',
  'gelecekteki rezervasyon tamamlanamaz'
);

select ok(
  pg_get_functiondef('public.guard_reservation_update()'::regprocedure)
    ilike '%no-show yalnızca başlamış onaylı rezervasyonda%',
  'no-show zaman ve durum kuralıyla korunur'
);

select * from finish();
rollback;
