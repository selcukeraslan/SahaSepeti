import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'E-posta gerekli').email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(100, 'Ad soyad çok uzun'),
  email: z.string().min(1, 'E-posta gerekli').email('Geçerli bir e-posta girin'),
  phone: z
    .string()
    .regex(/^0?5\d{9}$/, 'Geçerli bir cep telefonu girin (örn. 05xx xxx xx xx)')
    .optional()
    .or(z.literal('')),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  role: z.enum(['customer', 'venue_owner']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
