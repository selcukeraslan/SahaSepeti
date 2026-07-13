import { useEffect, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { cropImageToBlob } from '@/lib/image'

/** Kart ve galeriyle uyumlu sabit oran */
const ASPECT = 3 / 2

interface ImageCropDialogProps {
  file: File
  /** Kuyruktaki konum bilgisi: "2 / 5" gibi gösterilir (tek dosyada gizlenir) */
  queuePosition?: { current: number; total: number }
  onCancel: () => void
  onCropped: (blob: Blob) => void
  isUploading: boolean
}

/** Yüklemeden önce görseli 3:2 oranında kırpma/konumlama editörü. */
export function ImageCropDialog({
  file,
  queuePosition,
  onCancel,
  onCropped,
  isUploading,
}: ImageCropDialogProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  // Dosya değişince önizleme URL'i üret; eskisini serbest bırak, formu sıfırla.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setAreaPixels(null)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleConfirm = async () => {
    if (!src || !areaPixels) return
    setIsCropping(true)
    try {
      const blob = await cropImageToBlob(src, areaPixels)
      onCropped(blob)
    } finally {
      setIsCropping(false)
    }
  }

  const title = queuePosition && queuePosition.total > 1
    ? `Görseli Kırp (${queuePosition.current} / ${queuePosition.total})`
    : 'Görseli Kırp'

  return (
    <Dialog open onClose={onCancel} title={title}>
      <p className="text-sm text-slate-500 dark:text-ink-400">
        Görseli sürükleyerek konumlandırın, kaydırıcıyla yakınlaştırın. Kırpılan alan
        kartlarda ve galeride görünecek bölümdür.
      </p>

      <div className="relative mt-4 h-72 overflow-hidden rounded-2xl bg-slate-900">
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => setAreaPixels(pixels)}
          />
        )}
      </div>

      {/* Yakınlaştırma */}
      <div className="mt-4 flex items-center gap-3">
        <ZoomOut className="size-4 shrink-0 text-slate-400 dark:text-ink-500" aria-hidden />
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          aria-label="Yakınlaştırma"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary-600 dark:bg-ink-700"
        />
        <ZoomIn className="size-4 shrink-0 text-slate-400 dark:text-ink-500" aria-hidden />
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isUploading}>
          {queuePosition && queuePosition.total > 1 ? 'Bunu Atla' : 'Vazgeç'}
        </Button>
        <Button
          className="flex-1"
          isLoading={isCropping || isUploading}
          disabled={!areaPixels}
          onClick={() => void handleConfirm()}
        >
          Kırp ve Yükle
        </Button>
      </div>
    </Dialog>
  )
}
