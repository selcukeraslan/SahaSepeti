begin;

-- Reconcile the live request-id overload with the repository price-quote RPC.
-- No reservation rows or existing request identifiers are removed.
alter table public.reservations add column if not exists client_request_id uuid;
create unique index if not exists idx_reservations_customer_client_request
  on public.reservations(customer_id, client_request_id)
  where client_request_id is not null;

-- No CASCADE: unexpected dependencies abort the transaction instead of being removed.
create or replace function public.guard_client_request_identity() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.client_request_id is distinct from old.client_request_id then
    raise exception 'Rezervasyon istek kimliği değiştirilemez';
  end if;
  return new;
end;
$$;
create trigger trg_reservations_client_request_immutable
  before update of client_request_id on public.reservations
  for each row execute function public.guard_client_request_identity();

drop function if exists public.create_marketplace_reservation(uuid,uuid,date,time,time,numeric,text);

create or replace function public.create_marketplace_reservation(
  p_court_id uuid,
  p_venue_id uuid,
  p_reservation_date date,
  p_start_time time,
  p_end_time time,
  p_expected_total_price numeric,
  p_notes text default null,
  p_request_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Rezervasyon için giriş yapmalısınız';
  end if;

  if p_request_id is not null then
    -- Serialize retries before slot and pending-quota checks run.
    perform pg_advisory_xact_lock(hashtextextended(
      'reservation-request:' || auth.uid()::text || ':' || p_request_id::text, 0));
    select * into v_reservation from public.reservations
      where customer_id = auth.uid() and client_request_id = p_request_id;
    if found then
      if v_reservation.court_id is distinct from p_court_id
        or v_reservation.venue_id is distinct from p_venue_id
        or v_reservation.reservation_date is distinct from p_reservation_date
        or v_reservation.start_time is distinct from p_start_time
        or v_reservation.end_time is distinct from p_end_time
        or coalesce(v_reservation.notes,'') is distinct from coalesce(p_notes,'')
        or round(v_reservation.total_price,2) is distinct from round(p_expected_total_price,2) then
        raise exception 'İstek kimliği farklı bir rezervasyon için kullanılmış';
      end if;
      return to_jsonb(v_reservation);
    end if;
  end if;

  insert into public.reservations(
    court_id,venue_id,customer_id,reservation_date,start_time,end_time,
    total_price,notes,client_request_id
  ) values (
    p_court_id,p_venue_id,auth.uid(),p_reservation_date,p_start_time,p_end_time,
    0,p_notes,p_request_id
  ) returning * into v_reservation;

  if round(v_reservation.total_price,2) is distinct from round(p_expected_total_price,2) then
    raise exception 'Rezervasyon fiyatı değişti; güncel fiyatı kontrol edip tekrar deneyin.'
      using errcode = 'P0002', detail = jsonb_build_object(
        'currentTotalPrice',round(v_reservation.total_price,2)
      )::text;
  end if;
  return to_jsonb(v_reservation);
end;
$$;

revoke all on function public.create_marketplace_reservation(uuid,uuid,date,time,time,numeric,text,uuid)
  from public,anon;
grant execute on function public.create_marketplace_reservation(uuid,uuid,date,time,time,numeric,text,uuid)
  to authenticated;
notify pgrst, 'reload schema';
commit;
