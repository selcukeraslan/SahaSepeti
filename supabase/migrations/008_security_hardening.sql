-- ============================================================
-- SahaSepeti — 008: Güvenlik ve rezervasyon bütünlüğü sıkılaştırma
-- ============================================================

-- ---------- Yorum gizliliği ----------
-- Ham reviews satırları customer_id ve reservation_id içerir. Herkese açık
-- SELECT kaldırılır; ziyaretçiler yorumları maskeli RPC üzerinden okur.
drop policy if exists "reviews: herkese açık" on reviews;

create policy "reviews: müşteri kendi yorumunu görür"
  on reviews for select
  using (customer_id = auth.uid() or is_admin());

-- Tesis kartları için kişisel veri içermeyen toplu puan özeti.
create or replace function get_venue_rating_summaries(p_venue_ids uuid[])
returns table (
  venue_id uuid,
  avg_rating numeric,
  review_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.venue_id,
    avg(r.rating)::numeric as avg_rating,
    count(*)::bigint as review_count
  from reviews r
  join venues v on v.id = r.venue_id
  where r.venue_id = any(coalesce(p_venue_ids, array[]::uuid[]))
    and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
  group by r.venue_id;
$$;

revoke all on function get_venue_rating_summaries(uuid[]) from public;
grant execute on function get_venue_rating_summaries(uuid[]) to anon, authenticated;

-- Maskeli yorum RPC'sini de yalnızca uygulama rollerine açıkça sınırla.
revoke all on function get_venue_reviews(uuid) from public;
grant execute on function get_venue_reviews(uuid) to anon, authenticated;

-- ---------- Rezervasyon insert bütünlüğü ----------
create or replace function validate_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court courts%rowtype;
  v_opening opening_hours%rowtype;
  v_venue_status venue_status;
  v_rate numeric(10, 2);
  v_hours numeric;
  v_is_owner boolean;
begin
  select * into v_court from courts where id = new.court_id;
  if not found then
    raise exception 'Saha bulunamadı';
  end if;

  -- venue_id ve created_by istemciden güvenilir kabul edilmez.
  new.venue_id = v_court.venue_id;
  if auth.uid() is not null then
    new.created_by = auth.uid();
  end if;
  v_is_owner = owns_venue(v_court.venue_id) or is_admin();

  if (new.reservation_date + new.start_time)
     < (now() at time zone 'Europe/Istanbul') then
    raise exception 'Geçmiş bir saat için işlem yapılamaz';
  end if;

  -- Bakım/özel etkinlik blokları yalnızca owner/admin tarafından oluşturulur.
  -- Çalışma saati dışında blok koymak bilinçli olarak mümkündür.
  if new.is_block then
    if auth.uid() is not null and not v_is_owner then
      raise exception 'Saat bloklama yetkiniz yok';
    end if;
    new.customer_id = null;
    new.status = 'confirmed';
    new.no_show = false;
    new.guest_name = null;
    new.guest_phone = null;
    new.cancelled_at = null;
    new.cancellation_reason = null;
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

  -- Uygulamadaki slot motoruyla aynı kural: tam bir saat ve çalışma saati
  -- başlangıcına göre saatlik grid üzerinde olmalı.
  if new.end_time - new.start_time <> interval '1 hour' then
    raise exception 'Rezervasyon süresi tam 1 saat olmalı';
  end if;

  select * into v_opening
  from opening_hours
  where venue_id = v_court.venue_id
    and day_of_week = extract(dow from new.reservation_date)::int
    and not is_closed;

  if not found
     or new.start_time < v_opening.open_time
     or new.end_time > v_opening.close_time then
    raise exception 'Seçilen saat tesisin çalışma saatleri dışında';
  end if;

  if mod(
       extract(epoch from (new.start_time - v_opening.open_time))::bigint,
       3600
     ) <> 0 then
    raise exception 'Rezervasyon başlangıcı geçerli bir slot değil';
  end if;

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

  -- Hesaplı müşteri ve owner'ın manuel misafir kaydı birbirinden ayrılır.
  if new.customer_id is null then
    if auth.uid() is not null and not v_is_owner then
      raise exception 'Manuel rezervasyon yetkiniz yok';
    end if;
    if coalesce(btrim(new.guest_name), '') = '' then
      raise exception 'Manuel rezervasyon için müşteri adı gerekli';
    end if;
    new.status = 'confirmed';
  elsif auth.uid() is not null and not is_admin() then
    -- Owner kendi hesabıyla normal rezervasyon yapacaksa da müşteri akışı
    -- uygulanır; owner'ın doğrudan onaylı kaydı manuel (customer_id null) olmalıdır.
    new.customer_id = auth.uid();
    new.status = 'pending';
    new.guest_name = null;
    new.guest_phone = null;
  end if;

  new.is_block = false;
  new.no_show = false;
  new.cancelled_at = null;
  new.cancellation_reason = null;
  v_hours = extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  new.total_price = round(v_rate * v_hours, 2);
  new.deposit_amount = 0;

  return new;
end;
$$;

-- ---------- Rezervasyon update durum makinesi ----------
create or replace function guard_reservation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp = now() at time zone 'Europe/Istanbul';
  v_is_owner boolean = owns_venue(old.venue_id);
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
     or new.created_by is distinct from old.created_by
     or new.notes is distinct from old.notes then
    raise exception 'Rezervasyonun bu alanları güncellenemez';
  end if;

  -- Müşteri yalnızca zamanı gelmemiş kendi kaydını iptal eder.
  if auth.uid() = old.customer_id and not v_is_owner then
    if new.no_show is distinct from old.no_show then
      raise exception 'Bu alanı güncelleyemezsiniz';
    end if;
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Bu durum geçişine yetkiniz yok';
    end if;
    if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      if old.status not in ('pending', 'confirmed') then
        raise exception 'Bu rezervasyon iptal edilemez';
      end if;
      if (old.reservation_date + old.start_time) <= v_now then
        raise exception 'Saati geçmiş rezervasyon iptal edilemez';
      end if;
      new.cancelled_at = now();
    elsif new.cancelled_at is distinct from old.cancelled_at
       or new.cancellation_reason is distinct from old.cancellation_reason then
      raise exception 'İptal alanları yalnızca iptal sırasında güncellenebilir';
    end if;
    return new;
  end if;

  if not v_is_owner then
    raise exception 'Rezervasyonu güncelleme yetkiniz yok';
  end if;

  -- Owner durum makinesi: pending -> confirmed/cancelled,
  -- confirmed -> completed/cancelled; terminal durumlar geri açılamaz.
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'))
    ) then
      raise exception 'Geçersiz rezervasyon durum geçişi';
    end if;

    if new.status = 'completed'
       and (old.reservation_date + old.end_time) > v_now then
      raise exception 'Gelecekteki rezervasyon tamamlandı olarak işaretlenemez';
    end if;

    if new.status = 'cancelled' then
      new.cancelled_at = now();
      if coalesce(btrim(new.cancellation_reason), '') = '' then
        new.cancellation_reason = 'Tesis tarafından iptal edildi';
      end if;
    elsif new.cancelled_at is distinct from old.cancelled_at
       or new.cancellation_reason is distinct from old.cancellation_reason then
      raise exception 'İptal alanları yalnızca iptal sırasında güncellenebilir';
    end if;
  elsif new.cancelled_at is distinct from old.cancelled_at
     or new.cancellation_reason is distinct from old.cancellation_reason then
    raise exception 'İptal alanları yalnızca iptal sırasında güncellenebilir';
  end if;

  if new.no_show is distinct from old.no_show then
    if old.is_block
       or new.status not in ('confirmed', 'completed')
       or (old.reservation_date + old.start_time) > v_now then
      raise exception 'No-show yalnızca başlamış onaylı rezervasyonda işaretlenebilir';
    end if;
  end if;

  return new;
end;
$$;
