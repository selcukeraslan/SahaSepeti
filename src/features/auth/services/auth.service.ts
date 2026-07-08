import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database.types'
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '../schemas'

export async function signUp(input: RegisterInput): Promise<void> {
  const data = registerSchema.parse(input)
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        phone: data.phone || null,
        role: data.role,
      },
    },
  })
  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export async function signIn(input: LoginInput): Promise<void> {
  const data = loginSchema.parse(input)
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('Çıkış yapılırken bir hata oluştu')
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    throw new Error('Profil bilgisi alınamadı')
  }
  return data
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-posta veya şifre hatalı'
  }
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Bu e-posta adresi zaten kayıtlı'
  }
  if (message.includes('Password should be')) {
    return 'Şifre en az 8 karakter olmalı'
  }
  if (message.includes('Email not confirmed')) {
    return 'E-posta adresinizi doğrulamanız gerekiyor'
  }
  return 'Bir hata oluştu, lütfen tekrar deneyin'
}
