-- ============================================================
-- SahaSepeti — 014: Rezervasyon ufku ve bekleyen talep kotası
--
-- 013'ten sonra eklenir. Süresi dolan pending kayıtları otomatik iptal
-- edilmez; bu ürün kararı özellikle kapsam dışıdır.
-- ============================================================

begin;

create or replace function public.guard_reservation_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending_count integer;
begin
  -- Bloklar ve owner'ın doğrudan onaylı manuel kayıtları kota kapsamında
  -- değildir. Marketplace kayıtları validate trigger'ında pending olur.
  if new.is_block or new.customer_id is null or new.status <> 'pending' then
    return new;
  end if;

  if new.reservation_date > (now() at time zone 'Europe/Istanbul')::date + 30 then
    raise exception 'Rezervasyonlar en fazla 30 gün öncesinden yapılabilir';
  end if;

  -- Aynı kullanıcının iki paralel isteği kota kontrolünü birlikte geçemesin.
  perform pg_advisory_xact_lock(hashtextextended(new.customer_id::text, 0));
  select count(*) into v_pending_count
  from public.reservations
  where customer_id = new.customer_id
    and status = 'pending';

  if v_pending_count >= 3 then
    raise exception 'Aynı anda en fazla 3 bekleyen rezervasyonunuz olabilir';
  end if;

  return new;
end;
$$;

create trigger trg_reservations_limits
  before insert on public.reservations
  for each row execute function public.guard_reservation_limits();

commit;
