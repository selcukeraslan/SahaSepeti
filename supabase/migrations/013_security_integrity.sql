-- ============================================================
-- SahaSepeti — 013: Veri bütünlüğü ve yorum yetkisi
--
-- 012'den sonra eklenir. Eski migration'lar değiştirilmez.
-- ============================================================

begin;

-- Bir saha, rezervasyon geçmişi olsa da olmasa da başka tesise taşınamaz.
-- Aksi halde reservations.venue_id ile courts.venue_id ayrışır.
create or replace function public.guard_court_venue_change()
returns trigger
language plpgsql
as $$
begin
  if new.venue_id is distinct from old.venue_id then
    raise exception 'Sahanın bağlı olduğu tesis değiştirilemez';
  end if;
  return new;
end;
$$;

create trigger trg_courts_venue_immutable
  before update on public.courts
  for each row execute function public.guard_court_venue_change();

-- Owner yalnızca taslağı onaya gönderebilir veya reddedilmiş tesisi tekrar
-- onaya alabilir. Approved tesis draft'a çekilemez; silme yerine arşivlenir.
create or replace function public.guard_venue_status()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and new.status is distinct from old.status
     and not (
       (old.status = 'draft' and new.status = 'pending')
       or (old.status = 'rejected' and new.status = 'pending')
     ) then
    raise exception 'Bu durum geçişi yalnızca admin tarafından yapılabilir';
  end if;

  if new.status = 'pending' and old.status = 'rejected' then
    new.rejection_reason = null;
  end if;
  return new;
end;
$$;

create or replace function public.guard_venue_delete()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.reservations where venue_id = old.id) then
    raise exception 'Rezervasyon geçmişi olan tesis silinemez; askıya alınmalıdır';
  end if;
  return old;
end;
$$;

create trigger trg_venues_delete_guard
  before delete on public.venues
  for each row execute function public.guard_venue_delete();

-- Yorumun kimliği, müşterinin tamamlanmış rezervasyonuna bağlı kalır.
-- UPDATE politikası tek başına venue_id/reservation_id taşınmasını engellemezdi.
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

create trigger trg_reviews_integrity
  before insert or update on public.reviews
  for each row execute function public.guard_review_integrity();

-- Zod sınırı doğrudan Data API isteğiyle aşılamasın. NOT VALID mevcut eski
-- kayıtları bloklamadan yeni kayıtları korur; veri temizliği sonrası VALIDATE edilir.
alter table public.reservations
  add constraint reservations_notes_length check (notes is null or length(notes) <= 500) not valid;

commit;
