-- ============================================================
-- SahaSepeti — 015: Yorum FK temizliği
--
-- 013'teki immutable yorum bağlantısı korunur. PostgreSQL'in
-- reservations -> reviews ON DELETE SET NULL işlemi, kullanıcı UPDATE'i
-- değildir ve bu otomatik temizliğe izin verilmelidir.
-- ============================================================

begin;

create or replace function public.guard_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
  v_venue uuid;
begin
  if tg_op = 'UPDATE' then
    -- FK'nin ON DELETE SET NULL işlemi trigger zincirinin içinden gelir.
    -- Doğrudan API UPDATE'i pg_trigger_depth() = 1 olduğu için bu yolu geçemez.
    if new.reservation_id is null and old.reservation_id is not null
       and pg_trigger_depth() > 1 then
      return new;
    end if;

    if new.customer_id is distinct from old.customer_id
       or new.venue_id is distinct from old.venue_id
       or new.reservation_id is distinct from old.reservation_id then
      raise exception 'Yorumun müşteri, tesis ve rezervasyon bağlantısı değiştirilemez';
    end if;
  end if;

  if new.reservation_id is not null then
    select r.customer_id, r.venue_id into v_customer, v_venue
    from public.reservations r
    where r.id = new.reservation_id
      and r.status = 'completed';
    if not found or v_customer is distinct from new.customer_id
       or v_venue is distinct from new.venue_id then
      raise exception 'Yorum tamamlanmış rezervasyonla eşleşmiyor';
    end if;
  else
    if not exists (
      select 1 from public.reservations r
      where r.customer_id = new.customer_id
        and r.venue_id = new.venue_id
        and r.status = 'completed'
    ) then
      raise exception 'Yalnızca tamamlanmış rezervasyonu olan tesise yorum yapılabilir';
    end if;
  end if;

  return new;
end;
$$;

commit;
