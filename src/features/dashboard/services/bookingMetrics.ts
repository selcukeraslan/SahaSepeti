/** Tarayıcı Performance paneli için; müşteri/tesis/rezervasyon kimliği içermez. */
export function recordManualBookingDuration(startedAt: number) {
  const endedAt = performance.now()
  if (!Number.isFinite(startedAt) || startedAt < 0 || startedAt > endedAt) return
  if (performance.getEntriesByName('sahasepeti.manual-booking', 'measure').length >= 100) {
    performance.clearMeasures('sahasepeti.manual-booking')
  }
  performance.measure('sahasepeti.manual-booking', { start: startedAt, end: endedAt })
}
