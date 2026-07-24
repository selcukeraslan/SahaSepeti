import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface LightboxImage {
  url: string
  alt: string
}

export interface LightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

/** Tam ekran görsel görüntüleyici — ok tuşları/butonlarla gezinme, Esc ile kapanır. */
export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)),
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [images.length, onClose])

  const current = images[index]
  if (!current) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fotoğraf galerisi"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Önceki fotoğraf"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((i) => (i - 1 + images.length) % images.length)
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            aria-label="Sonraki fotoğraf"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((i) => (i + 1) % images.length)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="size-7" />
          </button>
        </>
      )}

      <img
        src={current.url}
        alt={current.alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] max-w-[92vw] rounded-xl object-contain shadow-soft-lg"
      />

      {images.length > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
          {index + 1} / {images.length}
        </span>
      )}
    </div>,
    document.body,
  )
}
