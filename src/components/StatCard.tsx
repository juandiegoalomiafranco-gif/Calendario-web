import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'

interface StatCardProps {
  label: string
  value: string
  unit?: string
  Icon?: LucideIcon
  caption?: string
  /** Color del icono, p. ej. `text-act-run bg-act-soft-run`. */
  tone?: string
}

/** Cifra destacada con su etiqueta: el ladrillo de la pantalla de Progreso. */
export function StatCard({ label, value, unit, Icon, caption, tone }: StatCardProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={cx(
              'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
              tone ?? 'bg-surface-2 text-content-muted',
            )}
          >
            <Icon size={15} strokeWidth={2.2} aria-hidden />
          </span>
        )}
        <span className="truncate text-sm text-content-muted">{label}</span>
      </div>

      <p className="mt-2 text-2xl font-bold tabular tracking-tight text-content">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-content-subtle">{unit}</span>}
      </p>

      {caption && <p className="mt-0.5 text-[11px] leading-snug text-content-subtle">{caption}</p>}
    </div>
  )
}
