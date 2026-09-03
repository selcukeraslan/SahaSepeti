import { useState } from 'react'
import { ImageOff, Images } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Lightbox } from '@/components/ui/Lightbox'
import type { VenueDetail } from '../types'

export function VenueGallery({ venue }: { venue: VenueDetail }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const photos = [
    ...(venue.cover_image_url ? [{ url: venue.cover_image_url, alt: venue.name }] : []),
    ...venue.images
      .filter((image) => image.url !== venue.cover_image_url)
      .map((image, index) => ({ url: image.url, alt: `${venue.name} görsel ${index + 2}` })),
  ]

  return (
    <>
      <section className="bg-[#f4f5ef] pt-5 dark:bg-ink-950 sm:pt-7">
        <Container>
          <div className="grid overflow-hidden rounded-[2rem] bg-ink-900 sm:h-[440px] sm:grid-cols-3">
            {photos[0] ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label="Fotoğrafları büyük görüntüle"
                className="group relative aspect-[3/2] cursor-zoom-in overflow-hidden sm:col-span-2 sm:aspect-auto sm:h-full"
              >
                <img
                  src={photos[0].url}
                  alt={photos[0].alt}
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                {photos.length > 1 && (
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur sm:hidden">
                    <Images className="size-3.5" aria-hidden />
                    {photos.length} fotoğraf
                  </span>
                )}
              </button>
            ) : (
              <div className="flex aspect-[3/2] items-center justify-center bg-ink-800 sm:col-span-2 sm:aspect-auto sm:h-full">
                <ImageOff className="size-10 text-ink-500" aria-hidden />
              </div>
            )}

            <div className="hidden h-full min-h-0 grid-rows-2 gap-1 sm:grid">
              {[1, 2].map((photoIndex) => {
                const photo = photos[photoIndex]
                if (!photo) {
                  return (
                    <div key={photoIndex} className="flex min-h-0 items-center justify-center bg-ink-800">
                      <ImageOff className="size-6 text-ink-500" aria-hidden />
                    </div>
                  )
                }
                const remaining = photos.length - 3
                const showMore = photoIndex === 2 && remaining > 0
                return (
                  <button
                    key={photoIndex}
                    type="button"
                    onClick={() => setLightboxIndex(photoIndex)}
                    aria-label={showMore ? `${remaining} fotoğraf daha` : 'Fotoğrafı büyük görüntüle'}
                    className="group relative min-h-0 cursor-zoom-in overflow-hidden"
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    {showMore && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/60 text-sm font-semibold text-white">
                        +{remaining} fotoğraf
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Container>
      </section>

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          images={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
