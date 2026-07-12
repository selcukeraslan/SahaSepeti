-- ============================================================
-- SahaSepeti — 006: Yorumların herkese açık okunması (maskeli yazar adı)
-- ============================================================
-- profiles tablosu RLS ile gizli olduğundan, yorum listesinde başkalarının
-- adı düz join ile okunamaz. Bu security-definer fonksiyon yalnızca yorum
-- alanlarını + KVKK dostu MASKELİ yazar adını ("Selçuk E.") döner; e-posta,
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
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    case
      when p.full_name is null or btrim(p.full_name) = '' then 'Kullanıcı'
      when position(' ' in btrim(p.full_name)) = 0 then btrim(p.full_name)
      else split_part(btrim(p.full_name), ' ', 1) || ' '
           || left(split_part(btrim(p.full_name), ' ', 2), 1) || '.'
    end as reviewer_name
  from reviews r
  left join profiles p on p.id = r.customer_id
  where r.venue_id = p_venue_id
  order by r.created_at desc;
$$;

grant execute on function get_venue_reviews(uuid) to anon, authenticated;
