-- ============================================================
-- SahaSepeti — 007: Tesis sahibi araçları
-- Manuel (misafir) rezervasyon, saat bloklama (bakım) ve no-show takibi.
-- Blok ve manuel kayıtlar birer `reservations` satırı olarak modellenir;
-- böylece çift-rezervasyon EXCLUDE kısıtı ve get_booked_slots doluluğu
-- otomatik olarak bunları da kapsar.
-- ============================================================

alter table reservations
  alter column customer_id drop not null,
  add column if not exists is_block boolean not null default false,
  add column if not exists no_show boolean not null default false,
  add column if not exists guest_name text,
  add column if not exists guest_phone text,
  add column if not exists created_by uuid references profiles (id) on delete set null;

-- Bütünlük: blok müşterisiz olur; normal kayıtta ya hesaplı müşteri ya misafir adı bulunmalı.
alter table reservations
  drop constraint if exists reservation_actor_present;
alter table reservations
  add constraint reservation_actor_present check (
    is_block or customer_id is not null or coalesce(btrim(guest_name), '') <> ''
  );

-- ---------- validate_reservation: blok + manuel desteği ----------
create or replace function validate_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court courts%rowtype;
  v_venue_status venue_status;
  v_rate numeric(10, 2);
  v_hours numeric;
begin
  select * into v_court from courts where id = new.court_id;
  if not found then
    raise exception 'Saha bulunamadı';
  end if;

  -- venue_id her zaman court'tan türetilir
  new.venue_id = v_court.venue_id;

  -- Oluşturan aktör her zaman gerçek çağıran (istemci spoof edemez);
  -- service-role/SQL editör (auth.uid() null) çağrılarında gelen değer korunur.
  if auth.uid() is not null then
    new.created_by = auth.uid();
  end if;

  -- Geçmişe kayıt yapılamaz (Europe/Istanbul) — hem rezervasyon hem blok
  if (new.reservation_date + new.start_time)
     < (now() at time zone 'Europe/Istanbul') then
    raise exception 'Geçmiş bir saat için işlem yapılamaz';
  end if;

  -- Saat bloğu (bakım/özel): fiyat/müşteri yok, aktif saha şartı aranmaz
  if new.is_block then
    new.customer_id = null;
    new.total_price = 0;
    new.deposit_amount = 0;
    return new;
  end if;

  if not v_court.is_active then
    raise exception 'Bu saha şu anda aktif değil';
  end if;

  select status into v_venue_status from venues where id = v_court.venue_id;
  if v_venue_status <> 'approved' then
    raise exception 'Bu tesis rezervasyona açık değil';
  end if;

  -- Fiyat kuralı: spesifik gün kuralı genel (null) kuraldan önceliklidir.
  -- Sıralama, istemcideki findSlotPrice (slots.ts) ile birebir aynıdır.
  select price into v_rate
  from price_rules
  where court_id = new.court_id
    and (day_of_week is null
         or day_of_week = extract(dow from new.reservation_date)::int)
    and start_time <= new.start_time
    and end_time >= new.end_time
  order by day_of_week nulls last, start_time, end_time, price
  limit 1;

  if v_rate is null then
    raise exception 'Bu saat aralığı için fiyat tanımlı değil';
  end if;

  v_hours = extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  new.total_price = round(v_rate * v_hours, 2);
  new.deposit_amount = 0;

  return new;
end;
$$;

-- ---------- guard_reservation_update: yeni alanların değişmezliği ----------
-- no_show güncellenebilir (owner işaretler); diğer yeni alanlar değişmezdir.
create or replace function guard_reservation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.customer_id is distinct from old.customer_id
     or new.court_id is distinct from old.court_id
     or new.venue_id is distinct from old.venue_id
     or new.reservation_date is distinct from old.reservation_date
     or new.start_time is distinct from old.start_time
     or new.end_time is distinct from old.end_time
     or new.total_price is distinct from old.total_price
     or new.deposit_amount is distinct from old.deposit_amount
     or new.is_block is distinct from old.is_block
     or new.guest_name is distinct from old.guest_name
     or new.guest_phone is distinct from old.guest_phone
     or new.created_by is distinct from old.created_by then
    raise exception 'Rezervasyonun bu alanları güncellenemez';
  end if;

  if old.status in ('cancelled', 'completed')
     and new.status is distinct from old.status then
    raise exception 'Tamamlanmış veya iptal edilmiş rezervasyon güncellenemez';
  end if;

  if auth.uid() = old.customer_id and not owns_venue(old.venue_id) then
    -- No-show yalnızca tesis sahibi tarafından işaretlenir
    if new.no_show is distinct from old.no_show then
      raise exception 'Bu alanı güncelleyemezsiniz';
    end if;
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Bu durum geçişine yetkiniz yok';
    end if;
    if new.status = 'cancelled'
       and old.status is distinct from 'cancelled'
       and (old.reservation_date + old.start_time)
           <= (now() at time zone 'Europe/Istanbul') then
      raise exception 'Saati geçmiş rezervasyon iptal edilemez';
    end if;
  end if;

  return new;
end;
$$;

-- ---------- RLS: owner manuel/blok oluşturur ve siler ----------
-- Tesis sahibi kendi tesisine misafir rezervasyonu veya saat bloğu ekler
-- (müşteri hesabı bağlanmaz → customer_id null; durum doğrudan onaylı).
create policy "reservations: owner manuel/blok oluşturur"
  on reservations for insert
  with check (
    owns_venue(venue_id)
    and customer_id is null
    and status = 'confirmed'
  );

-- Tesis sahibi yalnızca kendi eklediği blok/misafir kayıtlarını silebilir;
-- gerçek müşteri rezervasyonları silinmez (iptal edilir).
create policy "reservations: owner blok/misafir siler"
  on reservations for delete
  using (
    owns_venue(venue_id)
    and (is_block or customer_id is null)
  );
