import { supabase } from '@/lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database.types'
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '../schemas'

export type AuthStateChangeHandler = (
  event: AuthChangeEvent,
  session: Session | null,
) => void

export interface SignUpResult {
  /** E-posta doğrulaması açıksa oturum oluşmaz; kullanıcı bilgilendirilmelidir. */
  needsEmailConfirmation: boolean
}

export async function signUp(input: RegisterInput): Promise<SignUpResult> {
  const data = registerSchema.parse(input)
  const { data: result, error } = await supabase.auth.signUp({
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
  return { needsEmailConfirmation: result.session === null }
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

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw new Error('Oturum bilgisi alınamadı')
  }
  return data.session
}

export function subscribeToAuthChanges(handler: AuthStateChangeHandler): () => void {
  const { data } = supabase.auth.onAuthStateChange(handler)
  return () => data.subscription.unsubscribe()
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
