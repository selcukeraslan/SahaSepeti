-- ============================================================
-- SahaSepeti — 008: Tarih-saatte müsait tesis filtresi (RPC)
-- ============================================================
-- Verilen gün + saat aralığı için, en az bir aktif sahası AÇIK, FİYATLI ve
-- REZERVASYONSUZ olan onaylı tesislerin id'lerini döner. Kişisel veri sızdırmaz
-- (yalnızca venue_id). anon dahil herkes çağırabilir (get_booked_slots gibi).

create or replace function venues_available_at(p_date date, p_start time, p_end time)
returns table (venue_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select distinct c.venue_id
  from courts c
  join venues v on v.id = c.venue_id and v.status = 'approved'
  join opening_hours oh
    on oh.venue_id = c.venue_id
    and oh.day_of_week = extract(dow from p_date)::int
  where c.is_active
    and not oh.is_closed
    and oh.open_time <= p_start
    and oh.close_time >= p_end
    -- İstenen aralığı kapsayan fiyat kuralı olmalı
    and exists (
      select 1 from price_rules pr
      where pr.court_id = c.id
        and (pr.day_of_week is null or pr.day_of_week = extract(dow from p_date)::int)
        and pr.start_time <= p_start
        and pr.end_time >= p_end
    )
    -- Aralıkla çakışan (iptal olmayan) rezervasyon/blok olmamalı
    and not exists (
      select 1 from reservations r
      where r.court_id = c.id
        and r.reservation_date = p_date
        and r.status <> 'cancelled'
        and tsrange((r.reservation_date + r.start_time), (r.reservation_date + r.end_time))
            && tsrange((p_date + p_start), (p_date + p_end))
    );
$$;

grant execute on function venues_available_at(date, time, time) to anon, authenticated;
