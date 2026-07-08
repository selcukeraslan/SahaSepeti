import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'
import { VenueForm } from '@/features/dashboard/components/VenueForm'
import { useVenueMutations } from '@/features/dashboard/hooks/useDashboard'

export function VenueCreate() {
  const navigate = useNavigate()
  const { create } = useVenueMutations()
  const { toast } = useToast()

  return (
    <div className="max-w-2xl">
      <Link
        to="/panel/tesisler"
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tesislerim
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Yeni Tesis</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tesis bilgilerini kaydedin; ardından saha, fiyat ve çalışma saatlerini ekleyip onaya
        gönderin.
      </p>
      <div className="mt-6">
        <VenueForm
          isSaving={create.isPending}
          submitLabel="Tesisi Oluştur"
          onSubmit={(data) =>
            create.mutate(data, {
              onSuccess: (venue) => {
                toast('Tesis oluşturuldu — şimdi saha ve saat bilgilerini ekleyin', 'success')
                navigate(`/panel/tesisler/${venue.id}`)
              },
              onError: (error) => toast(error.message, 'error'),
            })
          }
        />
      </div>
    </div>
  )
}
