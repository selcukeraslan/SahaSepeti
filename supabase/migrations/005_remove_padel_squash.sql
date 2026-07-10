-- ============================================================
-- SahaSepeti — 005: Padel ve Squash spor türlerini kaldır
-- ============================================================
-- Mevcut (seed yüklenmiş) bir veritabanında bu sporları ve
-- onlara bağlı sahaları temizler. Bağımlılık sırası:
--   price_rules (court cascade) -> courts -> venue_sports (cascade) -> sports
--
-- NOT: Bu sporlara ait sahalarda AKTİF rezervasyon varsa
-- (reservations.court_id -> on delete restrict) silme başarısız olur;
-- önce ilgili rezervasyonların ele alınması gerekir.

-- Önce bu sporlara ait sahaları sil (price_rules cascade ile gider)
delete from courts
where sport_id in (select id from sports where slug in ('padel', 'squash'));

-- Sporları sil (venue_sports cascade ile gider)
delete from sports where slug in ('padel', 'squash');
