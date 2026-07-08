import { z } from 'zod'

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
  sportIds: z.array(z.string().uuid()).min(1, 'En az bir spor türü seçin'),
})

export type VenueInput = z.infer<typeof venueSchema>

export const courtSchema = z.object({
  name: z.string().min(2, 'Saha adı en az 2 karakter olmalı').max(80, 'Saha adı çok uzun'),
  sportId: z.string().uuid('Spor türü seçin'),
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
