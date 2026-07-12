import { Link } from 'react-router-dom'
import { HeartOff } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { VenueCard } from '@/features/venues/components/VenueCard'
import { useFavoriteVenues } from '@/features/favorites/hooks/useFavorites'

export function Favorites() {
  const { data: venues, isLoading, isError } = useFavoriteVenues()

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50 sm:text-3xl">Favorilerim</h1>
      <p className="mt-1 text-slate-500 dark:text-ink-400">
        {venues ? `${venues.length} tesis` : 'Favoriler yükleniyor...'}
      </p>

      {isLoading && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-72" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <EmptyState
            title="Bir şeyler ters gitti"
            description="Favorileriniz yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."
          />
        </div>
      )}

      {venues && venues.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={HeartOff}
            title="Henüz favoriniz yok"
            description="Beğendiğiniz tesisleri kalp simgesiyle favorilerinize ekleyin."
            action={
              <Link to="/tesisler">
                <Button>Tesisleri Keşfet</Button>
              </Link>
            }
          />
        </div>
      )}

      {venues && venues.length > 0 && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </Container>
  )
}
