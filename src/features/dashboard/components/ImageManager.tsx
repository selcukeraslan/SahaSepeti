import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import type { VenueImage } from '@/types/database.types'
import {
  deleteVenueImage,
  listVenueImages,
  setCoverImage,
  uploadVenueImage,
} from '../services/images.service'

export function ImageManager({
  venueId,
  coverImageUrl,
}: {
  venueId: string
  coverImageUrl: string | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: images, isLoading } = useQuery({
    queryKey: ['venue-images', venueId],
    queryFn: () => listVenueImages(venueId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['venue-images', venueId] })
    void queryClient.invalidateQueries({ queryKey: ['my-venues'] })
  }

  const deleteImage = useMutation({
    mutationFn: (image: VenueImage) => deleteVenueImage(image),
    onSuccess: () => {
      invalidate()
      toast('Görsel silindi', 'success')
    },
    onError: (error) => toast(error.message, 'error'),
  })

  const makeCover = useMutation({
    mutationFn: (url: string) => setCoverImage(venueId, url),
    onSuccess: () => {
      invalidate()
      toast('Kapak görseli güncellendi', 'success')
    },
    onError: (error) => toast(error.message, 'error'),
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    // Kapak yoksa, bu partideki İLK yüklenen görsel kapak olur (döngü öncesi sabitlenir).
    let needsCover = !coverImageUrl && (images?.length ?? 0) === 0
    try {
      for (const file of Array.from(files)) {
        const image = await uploadVenueImage(venueId, file)
        if (needsCover) {
          await setCoverImage(venueId, image.url)
          needsCover = false
        }
      }
      invalidate()
      toast('Görseller yüklendi', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Yükleme başarısız', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-ink-400">
          JPG, PNG veya WebP — en fazla 2MB. Yıldıza tıklayarak kapak görseli seçin.
        </p>
        <Button size="sm" isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          Görsel Yükle
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="aspect-[4/3]" />
            ))}
          </div>
        )}

        {images && images.length === 0 && (
          <EmptyState
            title="Henüz görsel yok"
            description="Tesisinizin fotoğraflarını ekleyin — görselli tesisler çok daha fazla rezervasyon alır."
          />
        )}

        {images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => {
              const isCover = image.url === coverImageUrl
              return (
                <div
                  key={image.id}
                  className={cn(
                    'group relative aspect-[4/3] overflow-hidden rounded-xl border-2',
                    isCover ? 'border-primary-600' : 'border-transparent',
                  )}
                >
                  <img
                    src={image.url}
                    alt="Tesis görseli"
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Kapak
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-slate-900/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isCover && (
                      <button
                        type="button"
                        aria-label="Kapak yap"
                        onClick={() => makeCover.mutate(image.url)}
                        className="rounded-lg bg-white/90 dark:bg-ink-900/90 p-1.5 text-slate-700 dark:text-ink-200 hover:bg-white dark:hover:bg-ink-900"
                      >
                        <Star className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Görseli sil"
                      onClick={() => deleteImage.mutate(image)}
                      className="rounded-lg bg-white/90 dark:bg-ink-900/90 p-1.5 text-red-600 hover:bg-white dark:hover:bg-ink-900"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
