-- ============================================================
-- SahaSepeti — 003: Row Level Security politikaları
-- ============================================================

alter table profiles enable row level security;
alter table venues enable row level security;
alter table venue_images enable row level security;
alter table sports enable row level security;
alter table venue_sports enable row level security;
alter table courts enable row level security;
alter table opening_hours enable row level security;
alter table price_rules enable row level security;
alter table reservations enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;

-- ---------- profiles ----------
create policy "profiles: kendi profilini gör"
  on profiles for select
  using (id = auth.uid() or is_admin());

-- Tesis sahibi, tesisine rezervasyon yapan müşterilerin profilini görebilir
create policy "profiles: owner müşteri profilini gör"
  on profiles for select
  using (
    exists (
      select 1 from reservations r
      where r.customer_id = profiles.id and owns_venue(r.venue_id)
    )
  );

create policy "profiles: kendi profilini güncelle"
  on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- ---------- venues ----------
create policy "venues: onaylı tesisler herkese açık"
  on venues for select
  using (status = 'approved' or owner_id = auth.uid() or is_admin());

create policy "venues: owner tesis oluşturur"
  on venues for insert
  with check (
    owner_id = auth.uid()
    and is_venue_owner()
    and status in ('draft', 'pending')
  );

create policy "venues: owner/admin günceller"
  on venues for update
  using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

create policy "venues: owner taslağını siler"
  on venues for delete
  using ((owner_id = auth.uid() and status = 'draft') or is_admin());

-- ---------- venue_images ----------
create policy "venue_images: görünürlük tesisle aynı"
  on venue_images for select
  using (
    exists (
      select 1 from venues v
      where v.id = venue_images.venue_id
        and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
    )
  );

create policy "venue_images: owner yönetir"
  on venue_images for insert
  with check (owns_venue(venue_id) or is_admin());

create policy "venue_images: owner günceller"
  on venue_images for update
  using (owns_venue(venue_id) or is_admin())
  with check (owns_venue(venue_id) or is_admin());

create policy "venue_images: owner siler"
  on venue_images for delete
  using (owns_venue(venue_id) or is_admin());

-- ---------- sports ----------
create policy "sports: herkese açık"
  on sports for select
  using (true);

-- ---------- venue_sports ----------
create policy "venue_sports: görünürlük tesisle aynı"
  on venue_sports for select
  using (
    exists (
      select 1 from venues v
      where v.id = venue_sports.venue_id
        and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
    )
  );

create policy "venue_sports: owner ekler"
  on venue_sports for insert
  with check (owns_venue(venue_id) or is_admin());

create policy "venue_sports: owner siler"
  on venue_sports for delete
  using (owns_venue(venue_id) or is_admin());

-- ---------- courts ----------
create policy "courts: görünürlük tesisle aynı"
  on courts for select
  using (
    exists (
      select 1 from venues v
      where v.id = courts.venue_id
        and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
    )
  );

create policy "courts: owner ekler"
  on courts for insert
  with check (owns_venue(venue_id) or is_admin());

create policy "courts: owner günceller"
  on courts for update
  using (owns_venue(venue_id) or is_admin())
  with check (owns_venue(venue_id) or is_admin());

create policy "courts: owner siler"
  on courts for delete
  using (owns_venue(venue_id) or is_admin());

-- ---------- opening_hours ----------
create policy "opening_hours: görünürlük tesisle aynı"
  on opening_hours for select
  using (
    exists (
      select 1 from venues v
      where v.id = opening_hours.venue_id
        and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
    )
  );

create policy "opening_hours: owner ekler"
  on opening_hours for insert
  with check (owns_venue(venue_id) or is_admin());

create policy "opening_hours: owner günceller"
  on opening_hours for update
  using (owns_venue(venue_id) or is_admin())
  with check (owns_venue(venue_id) or is_admin());

create policy "opening_hours: owner siler"
  on opening_hours for delete
  using (owns_venue(venue_id) or is_admin());

-- ---------- price_rules ----------
create policy "price_rules: görünürlük tesisle aynı"
  on price_rules for select
  using (
    exists (
      select 1 from courts c
      join venues v on v.id = c.venue_id
      where c.id = price_rules.court_id
        and (v.status = 'approved' or v.owner_id = auth.uid() or is_admin())
    )
  );

create policy "price_rules: owner ekler"
  on price_rules for insert
  with check (
    exists (
      select 1 from courts c
      where c.id = price_rules.court_id and owns_venue(c.venue_id)
    ) or is_admin()
  );

create policy "price_rules: owner günceller"
  on price_rules for update
  using (
    exists (
      select 1 from courts c
      where c.id = price_rules.court_id and owns_venue(c.venue_id)
    ) or is_admin()
  );

create policy "price_rules: owner siler"
  on price_rules for delete
  using (
    exists (
      select 1 from courts c
      where c.id = price_rules.court_id and owns_venue(c.venue_id)
    ) or is_admin()
  );

-- ---------- reservations ----------
-- Müşteri kendi rezervasyonlarını, owner tesisinin rezervasyonlarını görür.
create policy "reservations: ilgili taraflar görür"
  on reservations for select
  using (
    customer_id = auth.uid()
    or owns_venue(venue_id)
    or is_admin()
  );

create policy "reservations: müşteri oluşturur"
  on reservations for insert
  with check (
    customer_id = auth.uid()
    and status = 'pending'
  );

-- Müşteri yalnızca iptal edebilir (trigger + servis katmanı ek kontrol yapar)
create policy "reservations: müşteri iptal eder"
  on reservations for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid() and status = 'cancelled');

create policy "reservations: owner durum yönetir"
  on reservations for update
  using (owns_venue(venue_id) or is_admin())
  with check (owns_venue(venue_id) or is_admin());

-- Doluluk sorgusu: kişisel veri SIZDIRMADAN yalnızca dolu zaman
-- aralıklarını döner (anon dahil herkes çağırabilir).
create or replace function get_booked_slots(p_venue_id uuid, p_date date)
returns table (court_id uuid, start_time time, end_time time)
language sql
security definer
set search_path = public
stable
as $$
  select r.court_id, r.start_time, r.end_time
  from reservations r
  join venues v on v.id = r.venue_id
  where r.venue_id = p_venue_id
    and r.reservation_date = p_date
    and r.status <> 'cancelled'
    and v.status = 'approved';
$$;

-- ---------- payments (placeholder) ----------
create policy "payments: ilgili taraflar görür"
  on payments for select
  using (
    exists (
      select 1 from reservations r
      where r.id = payments.reservation_id
        and (r.customer_id = auth.uid() or owns_venue(r.venue_id))
    ) or is_admin()
  );

-- ---------- reviews (placeholder) ----------
create policy "reviews: herkese açık"
  on reviews for select
  using (true);

create policy "reviews: müşteri kendi yorumunu yazar"
  on reviews for insert
  with check (customer_id = auth.uid());

create policy "reviews: müşteri kendi yorumunu yönetir"
  on reviews for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "reviews: müşteri/admin siler"
  on reviews for delete
  using (customer_id = auth.uid() or is_admin());

-- ---------- favorites (placeholder) ----------
create policy "favorites: kendi favorilerini görür"
  on favorites for select
  using (customer_id = auth.uid());

create policy "favorites: kendi favorisini ekler"
  on favorites for insert
  with check (customer_id = auth.uid());

create policy "favorites: kendi favorisini siler"
  on favorites for delete
  using (customer_id = auth.uid());
