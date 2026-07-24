/** Görsel kırpma yardımcıları (canvas tabanlı, bağımlılıksız). */

export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/** Çıktı genişliği üst sınırı — dosya boyutunu ve belleği makul tutar. */
const MAX_OUTPUT_WIDTH = 1600
const JPEG_QUALITY = 0.9

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Görsel okunamadı'))
    image.src = src
  })
}

/**
 * Kaynak görselden seçilen piksel bölgesini kırpıp JPEG blob döner.
 * Kırpılan alan MAX_OUTPUT_WIDTH'ten genişse orantılı küçültülür.
 */
export async function cropImageToBlob(src: string, crop: PixelCrop): Promise<Blob> {
  const image = await loadImage(src)

  const scale = crop.width > MAX_OUTPUT_WIDTH ? MAX_OUTPUT_WIDTH / crop.width : 1
  const outWidth = Math.round(crop.width * scale)
  const outHeight = Math.round(crop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Görsel işlenemedi')

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outWidth,
    outHeight,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Görsel kırpılamadı'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}
