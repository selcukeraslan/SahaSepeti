import { supabase } from '@/lib/supabase'
import type { VenueImage } from '@/types/database.types'

const BUCKET = 'venue-images'
const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function listVenueImages(venueId: string): Promise<VenueImage[]> {
  const { data, error } = await supabase
    .from('venue_images')
    .select('*')
    .eq('venue_id', venueId)
    .order('sort_order')

  if (error) throw new Error('Görseller yüklenemedi')
  return data
}

export async function uploadVenueImage(venueId: string, file: File): Promise<VenueImage> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Yalnızca JPG, PNG veya WebP yükleyebilirsiniz')
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Görsel en fazla 2MB olabilir')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${venueId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file)
  if (uploadError) throw new Error('Görsel yüklenemedi')

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  // Yükleme sırası korunur: yeni görsel en yüksek sort_order + 1 alır.
  const { data: last } = await supabase
    .from('venue_images')
    .select('sort_order')
    .eq('venue_id', venueId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextSortOrder = (last?.[0]?.sort_order ?? -1) + 1

  const { data: image, error: insertError } = await supabase
    .from('venue_images')
    .insert({
      venue_id: venueId,
      storage_path: storagePath,
      url: publicUrl.publicUrl,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (insertError) {
    // DB kaydı başarısızsa yüklenen dosyayı geri al
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error('Görsel kaydedilemedi')
  }
  return image
}

export async function deleteVenueImage(image: VenueImage): Promise<void> {
  const { error: dbError } = await supabase.from('venue_images').delete().eq('id', image.id)
  if (dbError) throw new Error('Görsel silinemedi')

  await supabase.storage.from(BUCKET).remove([image.storage_path])

  // Silinen görsel kapak ise: kalan görsellerden ilkini kapak yap, yoksa temizle.
  const { data: venue } = await supabase
    .from('venues')
    .select('cover_image_url')
    .eq('id', image.venue_id)
    .maybeSingle()

  if (venue?.cover_image_url === image.url) {
    const { data: remaining } = await supabase
      .from('venue_images')
      .select('url')
      .eq('venue_id', image.venue_id)
      .order('sort_order')
      .limit(1)
    await supabase
      .from('venues')
      .update({ cover_image_url: remaining?.[0]?.url ?? null })
      .eq('id', image.venue_id)
  }
}

/** Kapak görselini günceller (tesis kartlarında ve detayda kullanılır). */
export async function setCoverImage(venueId: string, url: string): Promise<void> {
  const { error } = await supabase
    .from('venues')
    .update({ cover_image_url: url })
    .eq('id', venueId)
  if (error) throw new Error('Kapak görseli güncellenemedi')
}
