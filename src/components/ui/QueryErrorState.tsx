import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface QueryErrorStateProps {
  title?: string
  description?: string
  isRetrying?: boolean
  onRetry: () => void
}

export function QueryErrorState({
  title = 'Bir şeyler ters gitti',
  description = 'Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
  isRetrying = false,
  onRetry,
}: QueryErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={
        <Button variant="outline" size="sm" isLoading={isRetrying} onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden />
          Tekrar Dene
        </Button>
      }
    />
  )
}
