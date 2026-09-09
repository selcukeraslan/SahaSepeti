-- Rezervasyon oluşturulurken istemcinin gördüğü fiyatın güncel fiyatla
-- eşleşmesini atomik olarak kontrol eder. Nihai fiyatı yine mevcut trigger hesaplar.
create or replace function public.create_marketplace_reservation(
  p_court_id uuid,
  p_venue_id uuid,
  p_reservation_date date,
  p_start_time time,
  p_end_time time,
  p_expected_total_price numeric,
  p_notes text default null
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

  insert into public.reservations(
    court_id, venue_id, customer_id, reservation_date,
    start_time, end_time, total_price, notes
  ) values (
    p_court_id, p_venue_id, auth.uid(), p_reservation_date,
    p_start_time, p_end_time, 0, p_notes
  )
  returning * into v_reservation;

  if round(v_reservation.total_price, 2) is distinct from round(p_expected_total_price, 2) then
    raise exception 'Rezervasyon fiyatı değişti; güncel fiyatı kontrol edip tekrar deneyin.'
      using errcode = 'P0002';
  end if;

  return to_jsonb(v_reservation);
end;
$$;

revoke all on function public.create_marketplace_reservation(uuid, uuid, date, time, time, numeric, text)
  from public, anon;
grant execute on function public.create_marketplace_reservation(uuid, uuid, date, time, time, numeric, text)
  to authenticated;
