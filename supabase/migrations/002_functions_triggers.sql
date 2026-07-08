-- ============================================================
-- SahaSepeti — 002: Fonksiyonlar ve trigger'lar
-- ============================================================

-- ---------- updated_at otomatik güncelleme ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_venues_updated_at before update on venues
  for each row execute function set_updated_at();
create trigger trg_courts_updated_at before update on courts
  for each row execute function set_updated_at();
create trigger trg_reservations_updated_at before update on reservations
  for each row execute function set_updated_at();
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- ---------- RLS yardımcıları (security definer) ----------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_venue_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'venue_owner'
  );
$$;

create or replace function owns_venue(vid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from venues
    where id = vid and owner_id = auth.uid()
  );
$$;

-- ---------- Yeni kullanıcı → otomatik profil ----------
-- raw_user_meta_data.role yalnızca 'venue_owner' olabilir; 'admin' asla
-- (admin rolü sadece DB'den elle atanır).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    case
      when new.raw_user_meta_data ->> 'role' = 'venue_owner' then 'venue_owner'::user_role
      else 'customer'::user_role
    end
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Rol değişikliği koruması ----------
-- Kullanıcı kendi rolünü değiştiremez; yalnızca admin değiştirebilir.
create or replace function prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Rol değişikliği yalnızca admin tarafından yapılabilir';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_role_guard before update on profiles
  for each row execute function prevent_role_change();

-- ---------- Tesis durum geçişi koruması ----------
-- Owner yalnızca draft/pending arasında geçiş yapabilir;
-- approved/rejected/suspended durumlarını yalnızca admin atar.
-- (Owner approved tesisini düzenleyebilir, durum approved kalabilir.)
create or replace function guard_venue_status()
returns trigger
language plpgsql
as $$
begin
  if not is_admin()
     and new.status is distinct from old.status
     and new.status not in ('draft', 'pending') then
    raise exception 'Bu durum geçişi yalnızca admin tarafından yapılabilir';
  end if;
  -- Reddedilen tesis onaya geri gönderilirse gerekçe temizlenir
  if new.status = 'pending' and old.status = 'rejected' then
    new.rejection_reason = null;
  end if;
  return new;
end;
$$;

create trigger trg_venues_status_guard before update on venues
  for each row execute function guard_venue_status();

-- ---------- Rezervasyon doğrulama + sunucu tarafı fiyat ----------
-- Fiyat ASLA istemciden alınmaz: price_rules'tan hesaplanır.
-- venue_id istemciden alınmaz: court üzerinden türetilir.
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
  if not v_court.is_active then
    raise exception 'Bu saha şu anda aktif değil';
  end if;

  select status into v_venue_status from venues where id = v_court.venue_id;
  if v_venue_status <> 'approved' then
    raise exception 'Bu tesis rezervasyona açık değil';
  end if;

  -- venue_id her zaman court'tan türetilir
  new.venue_id = v_court.venue_id;

  -- Geçmişe rezervasyon yapılamaz (Europe/Istanbul)
  if (new.reservation_date + new.start_time)
     < (now() at time zone 'Europe/Istanbul') then
    raise exception 'Geçmiş bir saat için rezervasyon yapılamaz';
  end if;

  -- Fiyat kuralı: spesifik gün kuralı genel (null) kuraldan önceliklidir
  select price into v_rate
  from price_rules
  where court_id = new.court_id
    and (day_of_week is null
         or day_of_week = extract(dow from new.reservation_date)::int)
    and start_time <= new.start_time
    and end_time >= new.end_time
  order by day_of_week nulls last
  limit 1;

  if v_rate is null then
    raise exception 'Bu saat aralığı için fiyat tanımlı değil';
  end if;

  v_hours = extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  new.total_price = round(v_rate * v_hours, 2);

  return new;
end;
$$;

create trigger trg_reservations_validate before insert on reservations
  for each row execute function validate_reservation();
