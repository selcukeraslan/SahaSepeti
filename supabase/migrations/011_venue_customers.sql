begin;

create function public.normalize_customer_phone(p_phone text) returns text
language plpgsql immutable set search_path = public as $$
declare v text = regexp_replace(coalesce(p_phone,''),'[^0-9]','','g');
begin
  if coalesce(p_phone,'') ~ '[^+0-9() .[:space:]-]' then return null; end if;
  if left(v,4) = '0090' then v = substr(v,5);
  elsif length(v)=12 and left(v,2)='90' then v=substr(v,3);
  elsif length(v)=11 and left(v,1)='0' then v=substr(v,2); end if;
  if v ~ '^[2-5][0-9]{9}$' then return '+90'||v; end if;
  return null;
end;
$$;

create table public.venue_customers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  normalized_phone text not null check (normalized_phone = public.normalize_customer_phone(normalized_phone)
    and public.normalize_customer_phone(normalized_phone) is not null),
  display_name text not null check (length(btrim(display_name)) between 2 and 80),
  notes text not null default '' check (length(notes) <= 1000),
  profile_id uuid references public.profiles(id) on delete set null,
  is_blacklisted boolean not null default false,
  blacklist_reason text not null default '' check (length(blacklist_reason) <= 300),
  last_booking_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(venue_id, normalized_phone),
  check (not is_blacklisted or length(btrim(blacklist_reason)) >= 3)
);
create index idx_venue_customers_recent on public.venue_customers(venue_id,last_booking_at desc);
create index idx_venue_customers_flags on public.venue_customers(venue_id,is_blacklisted);
alter table public.venue_customers enable row level security;
create policy venue_customers_owner_read on public.venue_customers for select to authenticated
  using(public.owns_venue(venue_id) or public.is_admin());
revoke all on public.venue_customers from anon, authenticated;
grant select on public.venue_customers to authenticated;
create trigger trg_venue_customers_updated_at before update on public.venue_customers
  for each row execute function public.set_updated_at();

alter table public.reservations add column venue_customer_id uuid
  references public.venue_customers(id) on delete cascade;
create index idx_reservations_venue_customer on public.reservations(venue_customer_id,reservation_date);

-- Eski geçerli telefonları tesis içinde birleştir; platform profilleriyle otomatik eşleştirme yok.
insert into public.venue_customers(venue_id,normalized_phone,display_name)
select distinct on (venue_id,public.normalize_customer_phone(guest_phone))
  venue_id,public.normalize_customer_phone(guest_phone),btrim(guest_name)
from public.reservations
where source='manual' and public.normalize_customer_phone(guest_phone) is not null
  and length(btrim(guest_name)) between 2 and 80
order by venue_id,public.normalize_customer_phone(guest_phone),created_at desc,id;
alter table public.reservations disable trigger trg_reservations_updated_at;
update public.reservations r set venue_customer_id=c.id from public.venue_customers c
where r.source='manual' and c.venue_id=r.venue_id
  and c.normalized_phone=public.normalize_customer_phone(r.guest_phone);
alter table public.reservations enable trigger trg_reservations_updated_at;
update public.venue_customers c set last_booking_at=(select max(r.created_at) from public.reservations r
  where r.venue_customer_id=c.id and not r.series_superseded);

create function public.save_venue_customer(p_input jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_venue uuid; v_phone text; v_action text=p_input->>'action';
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısınız'; end if;
  if v_action='create' then
    v_venue=(p_input->>'venueId')::uuid;
    if not public.owns_venue(v_venue) then raise exception 'Müşteri yönetme yetkiniz yok'; end if;
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
  if not found or not public.owns_venue(v_venue) then raise exception 'Müşteri yönetme yetkiniz yok'; end if;
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

create function public.link_reservation_venue_customer() returns trigger
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
    if not public.owns_venue(v_venue) then raise exception 'Müşteri seçme yetkiniz yok'; end if;
    select * into v_customer from public.venue_customers where id=new.venue_customer_id and venue_id=v_venue for update;
    if not found then raise exception 'Müşteri bu tesise ait değil'; end if;
  else
    v_phone=public.normalize_customer_phone(new.guest_phone);
    if v_phone is null and coalesce(btrim(new.guest_phone),'')<>'' then raise exception 'Geçerli bir Türkiye telefonu girin'; end if;
    if v_phone is null or not public.owns_venue(v_venue) then return new; end if;
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
-- Mevcut validate trigger'ından önce, court_id üzerinden tesis doğrulanır.
create trigger trg_reservations_customer_link before insert or update on public.reservations
  for each row execute function public.link_reservation_venue_customer();

create function public.refresh_customer_booking_time() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id=case when tg_op='DELETE' then old.venue_customer_id else new.venue_customer_id end;
  if v_id is not null then update public.venue_customers set last_booking_at=(
    select max(created_at) from public.reservations where venue_customer_id=v_id and not series_superseded
  ) where id=v_id; end if;
  return null;
end;
$$;
create trigger trg_reservations_customer_recent after insert or update or delete on public.reservations
  for each row execute function public.refresh_customer_booking_time();

create function public.search_venue_customers(p_venue_id uuid,p_query text default '',p_filter text default 'all',
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
    where c.venue_id=p_venue_id and (coalesce(btrim(p_query),'')='' or
      position(lower(btrim(p_query)) in lower(c.display_name))>0 or
      (v_digits<>'' and position(v_digits in c.normalized_phone)>0))
      and (p_filter='all' or (p_filter='active' and not c.is_blacklisted)
        or (p_filter='blacklist' and c.is_blacklisted) or (p_filter='no_show' and s.no_show_count>0))
    order by c.last_booking_at desc nulls last,c.display_name,c.id limit p_limit offset p_offset
  ) rows;
  return v_result;
end;
$$;
revoke all on function public.save_venue_customer(jsonb) from public,anon;
revoke all on function public.search_venue_customers(uuid,text,text,integer,integer) from public,anon;
grant execute on function public.save_venue_customer(jsonb) to authenticated;
grant execute on function public.search_venue_customers(uuid,text,text,integer,integer) to authenticated;
commit;
