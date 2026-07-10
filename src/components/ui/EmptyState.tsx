import type { ReactNode } from 'react'
import { SearchX, type LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-14 text-center">
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3">
        <Icon className="size-7 text-slate-400 dark:text-slate-500" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
