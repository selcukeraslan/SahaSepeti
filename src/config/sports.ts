import { Dumbbell, Feather, Volleyball, CircleDot, Goal, type LucideIcon } from 'lucide-react'

/**
 * Spor türü ikon eşlemesi — sports.icon (DB) → lucide bileşeni.
 * DB'deki slug'larla senkron tutulur (supabase/seed.sql).
 */
const SPORT_ICONS: Record<string, LucideIcon> = {
  'hali-saha': Goal,
  basketbol: Dumbbell,
  tenis: CircleDot,
  voleybol: Volleyball,
  badminton: Feather,
}

export function getSportIcon(slug: string): LucideIcon {
  return SPORT_ICONS[slug] ?? Goal
}

/** Rezervasyon slot uzunluğu (saat) — MVP'de tüm sahalar için 1 saat. */
export const SLOT_DURATION_HOURS = 1
