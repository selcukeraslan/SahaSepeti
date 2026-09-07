begin;

create table public.reservation_series (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  court_id uuid not null references public.courts(id) on delete restrict,
  name text not null check (length(btrim(name)) between 2 and 80),
  guest_name text not null check (length(btrim(guest_name)) between 2 and 80),
  guest_phone text check (length(guest_phone) <= 20),
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  start_date date not null,
  end_date date not null,
  source public.reservation_source not null default 'manual' check (source = 'manual'),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (end_time - start_time = interval '1 hour')
);
create index idx_series_venue on public.reservation_series(venue_id);
create index idx_series_court on public.reservation_series(court_id);
alter table public.reservation_series enable row level security;
create policy series_owner_read on public.reservation_series for select to authenticated
  using (public.owns_venue(venue_id) or public.is_admin());
-- Tüm yazmalar yetki kontrolü yapan RPC'den geçer.
revoke all on public.reservation_series from anon, authenticated;
grant select on public.reservation_series to authenticated;
create trigger trg_series_updated_at before update on public.reservation_series
  for each row execute function public.set_updated_at();

alter table public.reservations
  add column series_id uuid references public.reservation_series(id) on delete cascade,
  add column occurrence_date date,
  add column series_superseded boolean not null default false,
  add constraint reservation_series_pair check ((series_id is null) = (occurrence_date is null));
create index idx_reservations_series on public.reservations(series_id, occurrence_date);
create unique index idx_series_active_occurrence on public.reservations(series_id, occurrence_date)
  where series_id is not null and status <> 'cancelled';

-- Seri bağı doğrudan REST ile taklit edilemez; tarihçe bağlantısı değiştirilemez.
create function public.guard_series_membership() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user <> 'postgres' and ((tg_op = 'INSERT' and new.series_superseded)
     or (tg_op = 'UPDATE' and new.series_superseded is distinct from old.series_superseded)) then
    raise exception 'Seri geçmişi yalnızca seri işlemiyle değiştirilebilir';
  end if;
  if tg_op = 'UPDATE' then
    if new.series_id is distinct from old.series_id or new.occurrence_date is distinct from old.occurrence_date then
      raise exception 'Seri bağlantısı değiştirilemez';
    end if;
  elsif new.series_id is not null and current_user <> 'postgres' then
    raise exception 'Seri kaydı yalnızca seri işlemiyle oluşturulabilir';
  end if;
  return new;
end;
$$;
create trigger trg_reservations_series_guard before insert or update on public.reservations
  for each row execute function public.guard_series_membership();

-- Önizleme aynı gerçek insert/trigger zincirini çalıştırır, iç transaction'ı geri alır.
-- Kaydet sırasında tekrar doğrulanır. Hatalı bir hafta varsa hiçbir değişiklik kalmaz.
create function public.manage_reservation_series(p_input jsonb, p_preview boolean default true)
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
    if not found or not public.owns_venue(v_court.venue_id) then raise exception 'Bu tesiste seri yönetme yetkiniz yok'; end if;
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
    if not found or v_anchor.series_id is null or not public.owns_venue(v_anchor.venue_id) then
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
revoke all on function public.manage_reservation_series(jsonb,boolean) from public, anon;
grant execute on function public.manage_reservation_series(jsonb,boolean) to authenticated;
alter policy "reservations: owner blok/misafir siler" on public.reservations
  using (owns_venue(venue_id) and (is_block or customer_id is null) and series_id is null);
commit;
