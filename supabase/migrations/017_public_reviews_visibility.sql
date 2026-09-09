-- Public yorumlar yalnızca yayındaki tesislerde görünür. Tesis sahibi ve
-- admin, kendi yetkili görünümünde onay bekleyen/askıdaki tesis yorumlarını
-- incelemeye devam edebilir.
create or replace function public.get_venue_reviews(p_venue_id uuid)
returns table (
  id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  reviewer_name text,
  owner_reply text,
  owner_reply_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      r.owner_reply,
      r.owner_reply_at,
      nullif(btrim(regexp_replace(coalesce(p.full_name, ''), '\s+', ' ', 'g')), '') as name
    from public.reviews r
    join public.venues v on v.id = r.venue_id
    left join public.profiles p on p.id = r.customer_id
    where r.venue_id = p_venue_id
      and (v.status = 'approved' or v.owner_id = auth.uid() or public.is_admin())
  )
  select
    id,
    rating,
    comment,
    created_at,
    case
      when name is null then 'Kullanıcı'
      when position(' ' in name) = 0 then left(name, 1) || '.'
      else left(split_part(name, ' ', 1), 1) || '. ' || left(split_part(name, ' ', 2), 1)
    end as reviewer_name,
    owner_reply,
    owner_reply_at
  from base
  order by created_at desc;
$$;

revoke all on function public.get_venue_reviews(uuid) from public, anon, authenticated;
grant execute on function public.get_venue_reviews(uuid) to anon, authenticated;
