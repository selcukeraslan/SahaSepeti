begin;

-- Logical removal preserves reservation history and blacklist protection.
alter table public.venue_customers add column deleted_at timestamptz;

create function public.delete_venue_customer(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_venue uuid;
begin
  select venue_id into v_venue from public.venue_customers where id=p_id for update;
  if auth.uid() is null or not found or not public.owns_venue(v_venue) then
    raise exception 'Müşteri silme yetkiniz yok';
  end if;
  update public.venue_customers set deleted_at=coalesce(deleted_at,now()) where id=p_id;
end;
$$;
revoke all on function public.delete_venue_customer(uuid) from public,anon;
grant execute on function public.delete_venue_customer(uuid) to authenticated;

-- Re-adding the same number restores the original record without erasing its flags.
alter function public.save_venue_customer(jsonb) rename to save_venue_customer_internal;
revoke all on function public.save_venue_customer_internal(jsonb) from public,anon,authenticated;
create function public.save_venue_customer(p_input jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id=public.save_venue_customer_internal(p_input);
  if p_input->>'action'='create' then
    update public.venue_customers set deleted_at=null where id=v_id and deleted_at is not null;
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_venue_customer(jsonb) from public,anon;
grant execute on function public.save_venue_customer(jsonb) to authenticated;

-- Successful new bookings restore a hidden contact. Existing blacklist guards run first.
create function public.restore_booked_venue_customer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.venue_customers set deleted_at=null
    where id=new.venue_customer_id and deleted_at is not null;
  return null;
end;
$$;
create trigger trg_reservations_customer_restore after insert on public.reservations
  for each row execute function public.restore_booked_venue_customer();

create or replace function public.search_venue_customers(p_venue_id uuid,p_query text default '',p_filter text default 'all',
  p_limit integer default 25,p_offset integer default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb; v_digits text=regexp_replace(coalesce(p_query,''),'[^0-9]','','g');
begin
  if auth.uid() is null or not public.owns_venue(p_venue_id) then raise exception 'Müşteri arama yetkiniz yok'; end if;
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

commit;
