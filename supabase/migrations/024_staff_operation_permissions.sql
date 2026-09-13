begin;

-- Preserve existing validation/state-machine logic, replacing only scoped permission checks.
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
  v_is_owner = public.has_venue_permission(v_court.venue_id,'reservations.write') or is_admin();

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

create or replace function guard_reservation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp = now() at time zone 'Europe/Istanbul';
  v_is_owner boolean = public.has_venue_permission(old.venue_id,'reservations.write');
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

create or replace function public.link_reservation_venue_customer() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_venue uuid; v_phone text; v_customer public.venue_customers%rowtype;
begin
  if tg_op='UPDATE' then
    if new.venue_customer_id is distinct from old.venue_customer_id then raise exception 'Müşteri bağlantısı değiştirilemez'; end if;
    return new;
  end if;
  if new.is_block or new.customer_id is not null then
    if new.venue_customer_id is not null then raise exception 'Bu kayıt müşteri rehberine bağlanamaz'; end if;
    return new;
  end if;
  select venue_id into v_venue from public.courts where id=new.court_id;
  if new.venue_customer_id is not null then
    if not public.has_venue_permission(v_venue,'customers.write') then raise exception 'Müşteri seçme yetkiniz yok'; end if;
    select * into v_customer from public.venue_customers where id=new.venue_customer_id and venue_id=v_venue for update;
    if not found then raise exception 'Müşteri bu tesise ait değil'; end if;
  else
    v_phone=public.normalize_customer_phone(new.guest_phone);
    if v_phone is null and coalesce(btrim(new.guest_phone),'')<>'' then raise exception 'Geçerli bir Türkiye telefonu girin'; end if;
    if v_phone is null or not public.has_venue_permission(v_venue,'customers.write') then return new; end if;
    if coalesce(length(btrim(new.guest_name)),0) not between 2 and 80 then raise exception 'Müşteri adını kontrol edin'; end if;
    insert into public.venue_customers(venue_id,normalized_phone,display_name)
      values(v_venue,v_phone,btrim(new.guest_name)) on conflict(venue_id,normalized_phone) do nothing;
    select * into v_customer from public.venue_customers where venue_id=v_venue and normalized_phone=v_phone for update;
  end if;
  if v_customer.is_blacklisted then raise exception 'Müşteri kara listede; yeni rezervasyon oluşturulamaz'; end if;
  new.venue_customer_id=v_customer.id;
  new.guest_name=v_customer.display_name;
  new.guest_phone=v_customer.normalized_phone;
  return new;
end;
$$;

create or replace function public.save_venue_customer_internal(p_input jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_venue uuid; v_phone text; v_action text=p_input->>'action';
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısınız'; end if;
  if v_action='create' then
    v_venue=(p_input->>'venueId')::uuid;
    if not public.has_venue_permission(v_venue,'customers.write') then raise exception 'Müşteri yönetme yetkiniz yok'; end if;
    v_phone=public.normalize_customer_phone(p_input->>'phone');
    if v_phone is null then raise exception 'Geçerli bir Türkiye telefonu girin'; end if;
    if coalesce(length(btrim(p_input->>'name')),0) not between 2 and 80 then raise exception 'Müşteri adını kontrol edin'; end if;
    insert into public.venue_customers(venue_id,normalized_phone,display_name)
      values(v_venue,v_phone,btrim(p_input->>'name')) on conflict(venue_id,normalized_phone) do nothing returning id into v_id;
    if v_id is null then select id into v_id from public.venue_customers where venue_id=v_venue and normalized_phone=v_phone; end if;
    return v_id;
  end if;
  v_id=(p_input->>'id')::uuid;
  select venue_id into v_venue from public.venue_customers where id=v_id for update;
  if not found or not public.has_venue_permission(v_venue,'customers.write') then raise exception 'Müşteri yönetme yetkiniz yok'; end if;
  if v_action='notes' then
    if p_input->>'notes' is null or length(p_input->>'notes')>1000 then raise exception 'Not en fazla 1000 karakter olabilir'; end if;
    update public.venue_customers set notes=p_input->>'notes' where id=v_id;
  elsif v_action='blacklist' then
    if coalesce(length(btrim(p_input->>'reason')),0) not between 3 and 300
       or jsonb_typeof(p_input->'blocked') is distinct from 'boolean' then raise exception 'Durum ve gerekçe gerekli'; end if;
    update public.venue_customers set is_blacklisted=(p_input->>'blocked')::boolean,
      blacklist_reason=btrim(p_input->>'reason') where id=v_id;
  else raise exception 'Geçersiz müşteri işlemi'; end if;
  return v_id;
end;
$$;

create or replace function public.delete_venue_customer(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_venue uuid;
begin
  select venue_id into v_venue from public.venue_customers where id=p_id for update;
  if auth.uid() is null or not found or not public.has_venue_permission(v_venue,'customers.write') then
    raise exception 'Müşteri silme yetkiniz yok';
  end if;
  update public.venue_customers set deleted_at=coalesce(deleted_at,now()) where id=p_id;
end;
$$;

create or replace function public.search_venue_customers(p_venue_id uuid,p_query text default '',p_filter text default 'all',
  p_limit integer default 25,p_offset integer default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb; v_digits text=regexp_replace(coalesce(p_query,''),'[^0-9]','','g');
begin
  if auth.uid() is null or not public.has_venue_permission(p_venue_id,'customers.read') then raise exception 'Müşteri arama yetkiniz yok'; end if;
  if p_limit is null or p_limit not between 1 and 50 or p_offset is null or p_offset<0
     or length(p_query)>80 or p_filter is null or p_filter not in ('all','active','blacklist','no_show') then
    raise exception 'Geçersiz arama'; end if;
  if length(v_digits)>=10 then v_digits=right(v_digits,10); end if;
  select coalesce(jsonb_agg(to_jsonb(rows)),'[]'::jsonb) into v_result from (
    select c.id,c.display_name, '+90 '||substr(c.normalized_phone,4,3)||' *** '||right(c.normalized_phone,4) as masked_phone,
      c.is_blacklisted,c.last_booking_at,s.total_count,s.cancel_count,s.no_show_count,s.last_visit
    from public.venue_customers c cross join lateral (
      select count(*) as total_count,count(*) filter(where status='cancelled') as cancel_count,
        count(*) filter(where no_show) as no_show_count,
        max(reservation_date) filter(where status='completed' and not no_show
          and reservation_date <= (now() at time zone 'Europe/Istanbul')::date) as last_visit
      from public.reservations r where r.venue_customer_id=c.id and not r.series_superseded
    ) s
    where c.deleted_at is null and c.venue_id=p_venue_id and (coalesce(btrim(p_query),'')='' or
      position(lower(btrim(p_query)) in lower(c.display_name))>0 or
      (v_digits<>'' and position(v_digits in c.normalized_phone)>0))
      and (p_filter='all' or (p_filter='active' and not c.is_blacklisted)
        or (p_filter='blacklist' and c.is_blacklisted) or (p_filter='no_show' and s.no_show_count>0))
    order by c.last_booking_at desc nulls last,c.display_name,c.id limit p_limit offset p_offset
  ) rows;
  return v_result;
end;
$$;

create or replace function public.manage_reservation_series(p_input jsonb, p_preview boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_action text = p_input->>'action';
  v_scope text = p_input->>'scope';
  v_series public.reservation_series%rowtype;
  v_anchor public.reservations%rowtype;
  v_row public.reservations%rowtype;
  v_court public.courts%rowtype;
  v_id uuid;
  v_date date;
  v_start time;
  v_end time;
  v_weeks integer;
  v_i integer;
  v_count integer = 0;
  v_failed boolean = false;
  v_results jsonb = '[]'::jsonb;
  v_reason text;
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısınız'; end if;
  if p_preview is null then raise exception 'Önizleme seçimi gerekli'; end if;
  if v_action is null or v_action not in ('create','update','cancel') then raise exception 'Geçersiz seri işlemi'; end if;
  if v_action = 'create' then
    select * into v_court from public.courts where id = (p_input->>'courtId')::uuid;
    if not found or not public.has_venue_permission(v_court.venue_id,'reservations.write') then raise exception 'Bu tesiste seri yönetme yetkiniz yok'; end if;
    v_weeks = (p_input->>'weeks')::integer;
    v_date = (p_input->>'date')::date;
    v_start = (p_input->>'startTime')::time;
    v_end = (p_input->>'endTime')::time;
    if v_weeks is null or v_weeks not between 1 and 52 or v_date is null
       or v_start is null or v_end is null then raise exception 'Geçerli tarih, saat ve 1–52 hafta seçin'; end if;
    if coalesce(length(btrim(p_input->>'guestName')),0) not between 2 and 80
       or coalesce(length(btrim(p_input->>'name')),0) not between 2 and 80
       or length(p_input->>'guestPhone') > 20 or length(p_input->>'notes') > 500 then
      raise exception 'Seri adı, müşteri veya not bilgilerini kontrol edin';
    end if;
  else
    if v_scope is null or v_scope not in ('one','following','all') then raise exception 'İşlem kapsamını seçin'; end if;
    select * into v_anchor from public.reservations where id = (p_input->>'reservationId')::uuid;
    if not found or v_anchor.series_id is null or not public.has_venue_permission(v_anchor.venue_id,'reservations.write') then
      raise exception 'Bu seriyi yönetme yetkiniz yok';
    end if;
    select * into v_series from public.reservation_series where id = v_anchor.series_id for update;
    v_id = v_series.id;
    if v_action = 'update' then
      v_start = (p_input->>'startTime')::time;
      v_end = (p_input->>'endTime')::time;
      if v_start is null or v_end is null then raise exception 'Yeni saat aralığını seçin'; end if;
    end if;
  end if;

  begin
    if v_action = 'create' then
      insert into public.reservation_series(venue_id,court_id,name,guest_name,guest_phone,
        weekday,start_time,end_time,start_date,end_date,created_by)
      values(v_court.venue_id,v_court.id,btrim(p_input->>'name'),btrim(p_input->>'guestName'),
        nullif(btrim(p_input->>'guestPhone'),''),extract(dow from v_date),v_start,v_end,
        v_date,v_date + (v_weeks-1)*7,auth.uid()) returning id into v_id;
      for v_i in 0..v_weeks-1 loop
        begin
          insert into public.reservations(court_id,venue_id,customer_id,reservation_date,start_time,end_time,
            guest_name,guest_phone,notes,series_id,occurrence_date)
          values(v_court.id,v_court.venue_id,null,v_date+v_i*7,v_start,v_end,
            btrim(p_input->>'guestName'),nullif(btrim(p_input->>'guestPhone'),''),nullif(p_input->>'notes',''),v_id,v_date+v_i*7)
          returning * into v_row;
          v_results = v_results || jsonb_build_array(jsonb_build_object('date',v_row.reservation_date,'price',v_row.total_price,'error',null));
        exception when others then
          v_failed = true;
          v_reason = case when sqlstate = '23P01' then 'Bu saat dolu' when sqlstate = 'P0001' then sqlerrm else 'Kayıt oluşturulamadı' end;
          v_results = v_results || jsonb_build_array(jsonb_build_object('date',v_date+v_i*7,'price',null,'error',v_reason));
        end;
        v_count = v_count + 1;
      end loop;
    else
      for v_row in select * from public.reservations
        where series_id = v_id and status in ('pending','confirmed')
          and reservation_date + start_time > now() at time zone 'Europe/Istanbul'
          and (v_scope = 'all' or (v_scope = 'one' and id = v_anchor.id)
            or (v_scope = 'following' and occurrence_date >= v_anchor.occurrence_date))
        order by occurrence_date for update
      loop
        begin
          update public.reservations set status = 'cancelled', series_superseded = (v_action = 'update'),
            cancellation_reason = case when v_action = 'update' then 'Seri saati değiştirildi' else 'Seri iptal işlemi' end
          where id = v_row.id;
          if v_action = 'update' then
            insert into public.reservations(court_id,venue_id,customer_id,reservation_date,start_time,end_time,
              guest_name,guest_phone,notes,series_id,occurrence_date)
            values(v_row.court_id,v_row.venue_id,null,v_row.reservation_date,v_start,v_end,
              v_row.guest_name,v_row.guest_phone,v_row.notes,v_id,v_row.occurrence_date)
            returning total_price into v_row.total_price;
          end if;
          v_results = v_results || jsonb_build_array(jsonb_build_object('date',v_row.reservation_date,'price',v_row.total_price,'error',null));
        exception when others then
          v_failed = true;
          v_reason = case when sqlstate = '23P01' then 'Bu saat dolu' when sqlstate = 'P0001' then sqlerrm else 'İşlem tamamlanamadı' end;
          v_results = v_results || jsonb_build_array(jsonb_build_object('date',v_row.reservation_date,'price',null,'error',v_reason));
        end;
        v_count = v_count + 1;
      end loop;
      if v_count = 0 then raise exception 'Bu kapsamda değiştirilebilir gelecek rezervasyon yok'; end if;
      update public.reservation_series set status = case when exists (
        select 1 from public.reservations where series_id = v_id and status in ('pending','confirmed')
          and reservation_date + start_time > now() at time zone 'Europe/Istanbul'
      ) then 'active' else 'cancelled' end where id = v_id;
    end if;
    if p_preview or v_failed then raise exception using errcode = 'ZX001', message = 'preview rollback'; end if;
  exception when sqlstate 'ZX001' then null;
  end;
  return jsonb_build_object('saved',not p_preview and not v_failed,'valid',not v_failed,
    'count',v_count,'seriesId',case when not p_preview and not v_failed then v_id else null end,'dates',v_results);
end;
$$;

revoke all on function public.save_venue_customer_internal(jsonb) from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;

