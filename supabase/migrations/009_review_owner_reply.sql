-- ============================================================
-- SahaSepeti — 009: Yoruma tesis sahibi yanıtı
-- ============================================================
-- Tesis sahibi, kendi tesisine gelen yorumlara herkese açık bir yanıt yazabilir.
-- Yanıt yalnızca security-definer RPC ile eklenir (owner doğrulaması içeride);
-- müşterinin rating/comment'ine dokunulmaz.

alter table reviews
  add column if not exists owner_reply text,
  add column if not exists owner_reply_at timestamptz;

-- ---------- Owner yanıtı ekle/güncelle/temizle ----------
create or replace function set_review_reply(p_review_id uuid, p_reply text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue uuid;
  v_clean text;
begin
  select venue_id into v_venue from reviews where id = p_review_id;
  if not found then
    raise exception 'Yorum bulunamadı';
  end if;
  if not owns_venue(v_venue) then
    raise exception 'Bu yoruma yanıt verme yetkiniz yok';
  end if;

  v_clean = nullif(btrim(p_reply), '');
  update reviews
  set owner_reply = v_clean,
      owner_reply_at = case when v_clean is null then null else now() end
  where id = p_review_id;
end;
$$;

grant execute on function set_review_reply(uuid, text) to authenticated;

-- ---------- get_venue_reviews: yanıt alanlarını da döndür ----------
-- Dönüş tipi (OUT sütunları) değiştiği için create-or-replace yetmez; önce düşür.
drop function if exists get_venue_reviews(uuid);
create function get_venue_reviews(p_venue_id uuid)
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
    from reviews r
    left join profiles p on p.id = r.customer_id
    where r.venue_id = p_venue_id
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

grant execute on function get_venue_reviews(uuid) to anon, authenticated;
