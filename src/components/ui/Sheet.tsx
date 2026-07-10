import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Panel yönü — mobil filtreler için 'bottom', menüler için 'right' */
  side?: 'right' | 'bottom'
}

export function Sheet({ open, onClose, title, children, side = 'right' }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'fixed flex flex-col bg-white dark:bg-ink-900 shadow-soft-lg',
          side === 'right'
            ? 'inset-y-0 right-0 w-full max-w-sm'
            : 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-ink-800 px-5 py-4">
          {title && <h2 className="text-base font-semibold text-slate-900 dark:text-ink-50">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1 text-slate-400 dark:text-ink-500 transition-colors hover:bg-slate-100 dark:hover:bg-ink-800 hover:text-slate-600 dark:hover:text-ink-300"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
