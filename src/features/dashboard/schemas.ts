import { z } from 'zod'
import { uuid } from '@/lib/validation'

export const venueSchema = z.object({
  name: z.string().min(3, 'Tesis adı en az 3 karakter olmalı').max(100, 'Tesis adı çok uzun'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir'),
  city: z.string().min(1, 'İl seçin'),
  district: z.string().min(1, 'İlçe girin'),
  address: z.string().max(300, 'Adres çok uzun'),
  phone: z
    .string()
    .regex(/^0\d{3} ?\d{3} ?\d{2} ?\d{2}$/, 'Geçerli bir telefon girin (örn. 0212 555 00 00)')
    .optional()
    .or(z.literal('')),
  amenities: z.array(z.string()),
  sportIds: z.array(uuid()).min(1, 'En az bir spor türü seçin'),
  /** Haritadan seçilen konum; ikisi birlikte dolu ya da birlikte boş olmalı */
  latitude: z.number().min(-90, 'Geçersiz konum').max(90, 'Geçersiz konum').nullable(),
  longitude: z.number().min(-180, 'Geçersiz konum').max(180, 'Geçersiz konum').nullable(),
})

export type VenueInput = z.infer<typeof venueSchema>

export const courtSchema = z.object({
  name: z.string().min(2, 'Saha adı en az 2 karakter olmalı').max(80, 'Saha adı çok uzun'),
  sportId: uuid('Spor türü seçin'),
  surfaceType: z.string().max(50).optional().or(z.literal('')),
  isIndoor: z.boolean(),
  capacity: z.number().int().min(1).max(100).optional(),
})

export type CourtInput = z.infer<typeof courtSchema>

export const openingHourSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(/^\d{2}:\d{2}$/),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean(),
  })
  .refine((value) => value.isClosed || value.openTime < value.closeTime, {
    message: 'Kapanış saati açılış saatinden sonra olmalı',
    path: ['closeTime'],
  })

export const openingHoursSchema = z.array(openingHourSchema).length(7)

export type OpeningHourInput = z.infer<typeof openingHourSchema>

export const priceRuleSchema = z
  .object({
    /** null = tüm günler */
    dayOfWeek: z.number().int().min(0).max(6).nullable(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Saat seçin'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Saat seçin'),
    price: z
      .number({ message: 'Fiyat girin' })
      .min(0, 'Fiyat 0 veya üzeri olmalı')
      .max(100000, 'Fiyat çok yüksek'),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: 'Bitiş saati başlangıçtan sonra olmalı',
    path: ['endTime'],
  })

export type PriceRuleInput = z.infer<typeof priceRuleSchema>

// ---------- Owner araçları: manuel rezervasyon + saat bloklama ----------

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

/** Owner'ın haritadan/kırpma... değil, takvimden eklediği misafir rezervasyonu. */
export const manualReservationSchema = z.object({
  venueId: uuid(),
  courtId: uuid('Saha seçin'),
  date: z.string().regex(dateRegex, 'Geçersiz tarih'),
  startTime: z.string().regex(timeRegex, 'Saat seçin'),
  endTime: z.string().regex(timeRegex, 'Saat seçin'),
  guestName: z.string().min(2, 'Müşteri adını girin').max(80, 'Ad çok uzun'),
  // Telefon owner'ın kendi iletişim notu; katı format dayatmayız (serbest ama kısa).
  guestPhone: z.string().max(20, 'Telefon çok uzun').optional().or(z.literal('')),
  notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional().or(z.literal('')),
})

export type ManualReservationInput = z.infer<typeof manualReservationSchema>

/** Owner'ın bir slotu bakım/özel için rezervasyona kapatması. */
export const blockSlotSchema = z.object({
  venueId: uuid(),
  courtId: uuid('Saha seçin'),
  date: z.string().regex(dateRegex, 'Geçersiz tarih'),
  startTime: z.string().regex(timeRegex, 'Saat seçin'),
  endTime: z.string().regex(timeRegex, 'Saat seçin'),
  reason: z.string().max(200, 'Açıklama çok uzun').optional().or(z.literal('')),
})

export type BlockSlotInput = z.infer<typeof blockSlotSchema>
