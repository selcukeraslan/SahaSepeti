-- ============================================================
-- SahaSepeti — Seed verisi
-- Sporlar (zorunlu) + demo kullanıcı/tesis verisi (YALNIZCA geliştirme).
-- Üretimde yalnızca "Sporlar" bölümünü çalıştırın.
-- ============================================================

-- ---------- Sporlar ----------
insert into sports (id, name, slug, icon) values
  ('a0000000-0000-0000-0000-000000000001', 'Halı Saha',  'hali-saha',  'goal'),
  ('a0000000-0000-0000-0000-000000000002', 'Basketbol',  'basketbol',  'dribbble'),
  ('a0000000-0000-0000-0000-000000000003', 'Tenis',      'tenis',      'circle-dot'),
  ('a0000000-0000-0000-0000-000000000004', 'Voleybol',   'voleybol',   'volleyball'),
  ('a0000000-0000-0000-0000-000000000006', 'Badminton',  'badminton',  'feather')
on conflict (slug) do nothing;

-- ============================================================
-- DEMO VERİSİ (yalnızca geliştirme ortamı)
-- Şifreler: demo1234
-- ============================================================

-- ---------- Demo auth kullanıcıları ----------
-- handle_new_user trigger'ı profiles satırlarını otomatik oluşturur.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'owner@demo.sahasepeti.dev',
   extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Tesis Sahibi","role":"venue_owner"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'admin@demo.sahasepeti.dev',
   extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'musteri@demo.sahasepeti.dev',
   extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Müşteri"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, identity_data, provider, provider_id,
   last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@demo.sahasepeti.dev","email_verified":true}',
   'email', '11111111-1111-1111-1111-111111111111', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@demo.sahasepeti.dev","email_verified":true}',
   'email', '22222222-2222-2222-2222-222222222222', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"musteri@demo.sahasepeti.dev","email_verified":true}',
   'email', '33333333-3333-3333-3333-333333333333', now(), now(), now())
on conflict do nothing;

-- Admin rolü yalnızca elle atanır (trigger metadata'daki admin'i yok sayar)
update profiles set role = 'admin'
where id = '22222222-2222-2222-2222-222222222222';

-- ---------- Demo tesisler ----------
insert into venues
  (id, owner_id, name, slug, description, city, district, address,
   phone, cover_image_url, amenities, status)
values
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Yeşilvadi Spor Kompleksi', 'yesilvadi-spor-kompleksi',
   'Kadıköy''ün merkezinde, profesyonel zeminli halı sahalar ve modern soyunma odalarıyla hizmetinizdeyiz. Gece maçları için full aydınlatma mevcuttur.',
   'İstanbul', 'Kadıköy', 'Caferağa Mah. Spor Cad. No:12',
   '0216 555 01 01', 'https://picsum.photos/seed/halisaha1/1200/800',
   array['Duş', 'Soyunma Odası', 'Otopark', 'Kafeterya', 'Aydınlatma', 'Kiralık Ekipman', 'Wi-Fi'],
   'approved'),
  ('b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Boğaz Arena', 'bogaz-arena',
   'Beşiktaş''ta kapalı ve açık kortlarıyla tenis tutkunlarının buluşma noktası. Deneyimli eğitmen kadrosu ve pro-shop hizmeti.',
   'İstanbul', 'Beşiktaş', 'Sinanpaşa Mah. Kort Sok. No:5',
   '0212 555 02 02', 'https://picsum.photos/seed/tenis1/1200/800',
   array['Duş', 'Soyunma Odası', 'Otopark', 'Kafeterya', 'Tribün', 'Wi-Fi'],
   'approved'),
  ('b0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Çankaya Basket Park', 'cankaya-basket-park',
   'Ankara Çankaya''da açık ve kapalı basketbol sahaları. Amatör ligler ve özel turnuvalar için ideal.',
   'Ankara', 'Çankaya', 'Birlik Mah. Pota Cad. No:8',
   '0312 555 03 03', 'https://picsum.photos/seed/basket1/1200/800',
   array['Duş', 'Soyunma Odası', 'Otopark', 'Aydınlatma', 'Tribün'],
   'pending')
on conflict (slug) do nothing;

-- ---------- Tesis-spor eşleşmeleri ----------
insert into venue_sports (venue_id, sport_id) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002')
on conflict do nothing;

-- ---------- Sahalar / kortlar ----------
insert into courts (id, venue_id, sport_id, name, surface_type, is_indoor, capacity) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'Saha 1 (Büyük)', 'Suni Çim', false, 14),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'Saha 2 (Kapalı)', 'Suni Çim', true, 12),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003', 'Kort 1 (Toprak)', 'Toprak', false, 4),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003', 'Kort 2 (Sert Zemin)', 'Sentetik', true, 4),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000002', 'Kapalı Salon', 'Parke', true, 10)
on conflict (id) do nothing;

-- ---------- Çalışma saatleri (her gün 09:00–23:00) ----------
insert into opening_hours (venue_id, day_of_week, open_time, close_time)
select v.id, d, '09:00'::time, '23:00'::time
from (values
  ('b0000000-0000-0000-0000-000000000001'::uuid),
  ('b0000000-0000-0000-0000-000000000002'::uuid),
  ('b0000000-0000-0000-0000-000000000003'::uuid)
) as v(id), generate_series(0, 6) as d
on conflict (venue_id, day_of_week) do nothing;

-- ---------- Fiyat kuralları ----------
-- Genel kural (tüm günler) + hafta sonu zamlı örnek
-- (idempotentlik: demo sahaların eski kuralları önce temizlenir)
delete from price_rules where court_id in (
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000005'
);

insert into price_rules (court_id, day_of_week, start_time, end_time, price) values
  ('c0000000-0000-0000-0000-000000000001', null, '09:00', '23:00', 1200),
  ('c0000000-0000-0000-0000-000000000001', 6,    '09:00', '23:00', 1500), -- Cumartesi
  ('c0000000-0000-0000-0000-000000000001', 0,    '09:00', '23:00', 1500), -- Pazar
  ('c0000000-0000-0000-0000-000000000002', null, '09:00', '23:00', 1400),
  ('c0000000-0000-0000-0000-000000000003', null, '09:00', '23:00', 800),
  ('c0000000-0000-0000-0000-000000000004', null, '09:00', '23:00', 900),
  ('c0000000-0000-0000-0000-000000000005', null, '09:00', '23:00', 1000);
