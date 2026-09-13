begin;

create function public.list_panel_venues()
returns table(id uuid, name text, role text)
language sql stable security definer set search_path = '' as $$
  select v.id,v.name,case when v.owner_id=auth.uid() then 'owner'
    when public.is_admin() then 'admin' else s.role end
  from public.venues v left join public.venue_staff s on s.venue_id=v.id and s.user_id=auth.uid()
  where auth.uid() is not null and (v.owner_id=auth.uid() or public.is_admin() or s.id is not null)
  order by v.name,v.id;
$$;
create function public.list_venue_staff(p_venue_id uuid)
returns table(id uuid,venue_id uuid,user_id uuid,role text,full_name text,created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id,s.venue_id,s.user_id,s.role,p.full_name,s.created_at
  from public.venue_staff s join public.profiles p on p.id=s.user_id
  where s.venue_id=p_venue_id and public.has_venue_permission(p_venue_id,'staff.manage')
  order by s.created_at desc,s.id;
$$;

-- Calendar viewers do not receive names, contact information, notes, or series IDs.
-- They have no direct reservation-table grant via staff policies.
create function public.get_panel_schedule(p_venue_id uuid,p_date date)
returns table(id uuid,series_id uuid,source public.reservation_source,court_id uuid,
  start_time time,end_time time,status public.reservation_status,is_block boolean,
  no_show boolean,guest_name text,guest_phone text,notes text,profiles jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare v_details boolean;
begin
  if not public.has_venue_permission(p_venue_id,'calendar.read') then
    raise exception 'Bu tesisin takvimini görme yetkiniz yok';
  end if;
  v_details := public.has_venue_permission(p_venue_id,'customers.read');
  return query select r.id,case when v_details then r.series_id end,r.source,r.court_id,
    r.start_time,r.end_time,r.status,r.is_block,r.no_show,
    case when v_details then r.guest_name else 'Dolu' end,
    case when v_details then r.guest_phone end,case when v_details then r.notes end,
    case when v_details and p.id is not null then jsonb_build_object('full_name',p.full_name,'phone',p.phone) end
  from public.reservations r left join public.profiles p on p.id=r.customer_id
  where r.venue_id=p_venue_id and r.reservation_date=p_date and r.status<>'cancelled';
end;
$$;
revoke all on function public.list_panel_venues(), public.list_venue_staff(uuid), public.get_panel_schedule(uuid,date) from public,anon;
grant execute on function public.list_panel_venues(), public.list_venue_staff(uuid), public.get_panel_schedule(uuid,date) to authenticated;

create policy staff_venue_read on public.venues for select to authenticated
  using(public.has_venue_permission(id,'calendar.read'));
create policy staff_venue_update on public.venues for update to authenticated
  using(public.has_venue_permission(id,'venue.write')) with check(public.has_venue_permission(id,'venue.write'));
-- An expanded update policy must not allow ownership transfer through raw API.
create function public.guard_venue_identity() returns trigger language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then
    raise exception 'Tesis sahipliği ve kimliği değiştirilemez';
  end if;
  return new;
end;
$$;
create trigger trg_venues_identity before update on public.venues for each row execute function public.guard_venue_identity();

create policy staff_reservation_read on public.reservations for select to authenticated
  using(public.has_venue_permission(venue_id,'reservations.write'));
create policy staff_reservation_insert on public.reservations for insert to authenticated
  with check(public.has_venue_permission(venue_id,'reservations.write') and customer_id is null);
create policy staff_reservation_update on public.reservations for update to authenticated
  using(public.has_venue_permission(venue_id,'reservations.write'))
  with check(public.has_venue_permission(venue_id,'reservations.write'));
create policy staff_reservation_delete on public.reservations for delete to authenticated
  using(public.has_venue_permission(venue_id,'reservations.write') and customer_id is null and series_id is null);
create policy staff_customer_read on public.venue_customers for select to authenticated
  using(public.has_venue_permission(venue_id,'customers.read'));
create policy staff_series_read on public.reservation_series for select to authenticated
  using(public.has_venue_permission(venue_id,'reservations.write'));
create policy staff_customer_profile_read on public.profiles for select to authenticated
  using(exists(select 1 from public.reservations r where r.customer_id=profiles.id
    and public.has_venue_permission(r.venue_id,'customers.read')));

-- These tables use venue_id directly. Existing public visibility is preserved.
do $$
declare t text;
begin
  foreach t in array array['courts','opening_hours','venue_images','venue_sports'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using(public.has_venue_permission(venue_id,''calendar.read''))',t);
    execute format('create policy staff_insert on public.%I for insert to authenticated with check(public.has_venue_permission(venue_id,''venue.write''))',t);
    execute format('create policy staff_update on public.%I for update to authenticated using(public.has_venue_permission(venue_id,''venue.write'')) with check(public.has_venue_permission(venue_id,''venue.write''))',t);
    execute format('create policy staff_delete on public.%I for delete to authenticated using(public.has_venue_permission(venue_id,''venue.write''))',t);
  end loop;
end;
$$;
create policy staff_price_read on public.price_rules for select to authenticated
  using(exists(select 1 from public.courts c where c.id=court_id and public.has_venue_permission(c.venue_id,'calendar.read')));
create policy staff_price_write on public.price_rules for all to authenticated
  using(exists(select 1 from public.courts c where c.id=court_id and public.has_venue_permission(c.venue_id,'venue.write')))
  with check(exists(select 1 from public.courts c where c.id=court_id and public.has_venue_permission(c.venue_id,'venue.write')));
create policy staff_image_insert on storage.objects for insert to authenticated
  with check(bucket_id='venue-images' and public.has_venue_permission(((storage.foldername(name))[1])::uuid,'venue.write'));
create policy staff_image_delete on storage.objects for delete to authenticated
  using(bucket_id='venue-images' and public.has_venue_permission(((storage.foldername(name))[1])::uuid,'venue.write'));

notify pgrst, 'reload schema';
commit;
