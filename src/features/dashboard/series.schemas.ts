import { z } from 'zod'
import { manualReservationSchema } from './schemas'
import { uuid } from '@/lib/validation'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Geçerli saat seçin')
const duration = (v: { startTime: string; endTime: string }) => {
  const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3))
  return minutes(v.endTime) - minutes(v.startTime) === 60
}
export const createSeriesSchema = manualReservationSchema.extend({
  action: z.literal('create'),
  name: z.string().trim().min(2).max(80),
  date: z.iso.date(),
  startTime: time,
  endTime: time,
  weeks: z.number().int().min(1).max(52),
}).refine(duration, { message: 'Rezervasyon süresi tam bir saat olmalı', path: ['endTime'] })
const scope = z.enum(['one', 'following', 'all'])
export const changeSeriesSchema = z.object({
  action: z.literal('update'), reservationId: uuid(), scope, startTime: time, endTime: time,
}).refine(duration, { message: 'Rezervasyon süresi tam bir saat olmalı', path: ['endTime'] })
export const seriesInputSchema = z.union([createSeriesSchema, changeSeriesSchema,
  z.object({ action: z.literal('cancel'), reservationId: uuid(), scope }),
])
export const seriesResultSchema = z.object({
  saved: z.boolean(), valid: z.boolean(), count: z.number(), seriesId: z.string().nullable(),
  dates: z.array(z.object({ date: z.string(), price: z.number().nullable(), error: z.string().nullable() })),
})
export type SeriesInput = z.infer<typeof seriesInputSchema>
export type SeriesResult = z.infer<typeof seriesResultSchema>
