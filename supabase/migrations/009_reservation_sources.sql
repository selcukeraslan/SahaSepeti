-- Faz 14: Rezervasyon kaynağı. Mevcut fiyat/durum/doluluk ve RLS kuralları korunur.
begin;

create type public.reservation_source as enum ('marketplace', 'manual', 'block', 'external');

alter table public.reservations
  add column source public.reservation_source,
  add column guest_reference uuid,
  add column external_provider text,
  add column external_reservation_id text;

-- guest_reference hesap gerektirmeyen, bu misafir kaydına ait sabit referanstır.
-- Telefon/ad eşleşmesiyle insanları birleştirmez. Faz 16 müşteri rehberi ayrı tasarlanır.
-- created_by zaten 007'de vardır; bilinmeyen tarihsel aktörler uydurulmaz.
-- Teknik backfill, iş kaydının son güncellenme tarihini değiştirmemeli.
alter table public.reservations disable trigger trg_reservations_updated_at;
update public.reservations
set source = case
      when is_block then 'block'::public.reservation_source
      when customer_id is null then 'manual'::public.reservation_source
      else 'marketplace'::public.reservation_source
    end,
    guest_reference = case when not is_block and customer_id is null then gen_random_uuid() end;
alter table public.reservations enable trigger trg_reservations_updated_at;

alter table public.reservations
  alter column source set not null,
  add constraint reservation_source_shape check (
    (source = 'block' and is_block and customer_id is null and guest_reference is null)
    or (source = 'manual' and not is_block and customer_id is null and guest_reference is not null)
    or (source = 'marketplace' and not is_block and customer_id is not null and guest_reference is null)
    or (source = 'external' and not is_block)
  ),
  add constraint reservation_external_identity check (
    (source <> 'external' and external_provider is null and external_reservation_id is null)
    or (source = 'external'
        and external_provider is not null and btrim(external_provider) <> ''
        and external_reservation_id is not null and btrim(external_reservation_id) <> '')
  );

create index idx_reservations_venue_source_date
  on public.reservations (venue_id, source, reservation_date);
create unique index idx_reservations_guest_reference
  on public.reservations (guest_reference) where guest_reference is not null;
create unique index idx_reservations_external_identity
  on public.reservations (venue_id, external_provider, external_reservation_id)
  where source = 'external';

create function public.guard_reservation_source()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.source is distinct from old.source
       or new.guest_reference is distinct from old.guest_reference
       or new.external_provider is distinct from old.external_provider
       or new.external_reservation_id is distinct from old.external_reservation_id then
      raise exception 'Rezervasyon kaynağı ve referansları değiştirilemez';
    end if;
    return new;
  end if;

  -- Provider kimliği istemciden veya admin ekranından kabul edilmez.
  -- Dış sisteme ait kayıt oluşturma, Faz 20'nin yetkili adapter akışını bekler.
  if new.source = 'external' or new.external_provider is not null
     or new.external_reservation_id is not null then
    raise exception 'Dış sistem rezervasyonları henüz kullanıma açık değil';
  end if;

  -- trg_reservations_validate önce çalışır: customer_id, is_block ve fiyat doğrulanmıştır.
  new.source = case when new.is_block then 'block'::public.reservation_source
    when new.customer_id is null then 'manual'::public.reservation_source
    else 'marketplace'::public.reservation_source end;
  new.guest_reference = case when new.source = 'manual' then gen_random_uuid() end;
  return new;
end;
$$;

-- Postgres aynı tür trigger'ları ad sırasıyla çalıştırır; normalizasyondan sonra çalışmalı.
create trigger trg_reservations_z_source_guard
  before insert or update on public.reservations
  for each row execute function public.guard_reservation_source();

comment on column public.reservations.source is 'DB tarafından belirlenen, değiştirilemeyen rezervasyon kaynağı';
comment on column public.reservations.guest_reference is 'Misafir kaydına özgü referans; ortak müşteri kimliği değildir';

commit;
