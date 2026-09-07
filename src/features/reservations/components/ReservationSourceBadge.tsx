import { Badge } from '@/components/ui/Badge'
import type { ReservationSource } from '@/types/database.types'
import { RESERVATION_SOURCE_LABELS } from '../types'

export function ReservationSourceBadge({ source }: { source: ReservationSource }) {
  return <Badge variant={source === 'marketplace' ? 'success' : 'neutral'}>
    {RESERVATION_SOURCE_LABELS[source]}
  </Badge>
}
