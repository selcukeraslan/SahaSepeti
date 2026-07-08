-- ============================================================
-- SahaSepeti — 004: Storage bucket ve politikaları
-- ============================================================

-- Tesis görselleri bucket'ı (public okuma)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-images',
  'venue-images',
  true,
  2097152, -- 2MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Dosya yolu düzeni: {venue_id}/{uuid}.{ext}
-- Owner yalnızca kendi tesisinin klasörüne yazabilir/silebilir.

create policy "venue-images: herkes okur"
  on storage.objects for select
  using (bucket_id = 'venue-images');

create policy "venue-images: owner yükler"
  on storage.objects for insert
  with check (
    bucket_id = 'venue-images'
    and owns_venue(((storage.foldername(name))[1])::uuid)
  );

create policy "venue-images: owner siler"
  on storage.objects for delete
  using (
    bucket_id = 'venue-images'
    and (owns_venue(((storage.foldername(name))[1])::uuid) or is_admin())
  );
