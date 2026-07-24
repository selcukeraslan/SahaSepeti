-- ============================================================
-- SahaSepeti — 006: Yorumların herkese açık okunması (maskeli yazar adı)
-- ============================================================
-- profiles tablosu RLS ile gizli olduğundan, yorum listesinde başkalarının
-- adı düz join ile okunamaz. Bu security-definer fonksiyon yalnızca yorum
-- alanlarını + KVKK dostu MASKELİ yazar adını ("S. E") döner; e-posta,
-- telefon gibi kişisel veriyi asla sızdırmaz. anon dahil herkes çağırabilir.

create or replace function get_venue_reviews(p_venue_id uuid)
returns table (
  id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  reviewer_name text
)
language sql
security definer
set search_path = public
stable
as $$
  -- Adı normalize et (baş/son + iç fazladan boşlukları tek boşluğa indir);
  -- boşsa null yap ki maskede "Kullanıcı"ya düşsün.
  with base as (
    select
      r.id,
      r.rating,
      r.comment,
      r.created_at,
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
      -- Tek kelime ad → "S."
      when position(' ' in name) = 0 then left(name, 1) || '.'
      -- Ad Soyad → "S. E" (her ikisi de baş harf)
      else left(split_part(name, ' ', 1), 1) || '. ' || left(split_part(name, ' ', 2), 1)
    end as reviewer_name
  from base
  order by created_at desc;
$$;

grant execute on function get_venue_reviews(uuid) to anon, authenticated;
