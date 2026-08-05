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

const SPORT_PRIORITY = ['hali-saha', 'basketbol'] as const

/** Halı saha ve basketbolu öne alır; kalan sporları Türkçe alfabetik sıralar. */
export function sortSportsByPriority<T extends { slug: string; name: string }>(
  sports: readonly T[],
): T[] {
  return [...sports].sort((left, right) => {
    const leftPriority = SPORT_PRIORITY.indexOf(left.slug as (typeof SPORT_PRIORITY)[number])
    const rightPriority = SPORT_PRIORITY.indexOf(right.slug as (typeof SPORT_PRIORITY)[number])
    const leftRank = leftPriority === -1 ? SPORT_PRIORITY.length : leftPriority
    const rightRank = rightPriority === -1 ? SPORT_PRIORITY.length : rightPriority
    return leftRank - rightRank || left.name.localeCompare(right.name, 'tr')
  })
}

/** Rezervasyon slot uzunluğu (saat) — MVP'de tüm sahalar için 1 saat. */
export const SLOT_DURATION_HOURS = 1
