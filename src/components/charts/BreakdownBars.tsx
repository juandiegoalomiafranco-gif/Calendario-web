import type { LucideIcon } from 'lucide-react'
import { cx } from '../../lib/cx'

export interface BreakdownRow {
  key: string
  Icon: LucideIcon
  label: string
  count: number
  /** Clase de color de la barra, p. ej. `bg-cat-blue`. */
  colorClass: string
  /** Fondo suave del icono, p. ej. `bg-cat-soft-blue text-cat-blue`. */
  toneClass?: string
}

export function BreakdownBars({ rows, suffix }: { rows: BreakdownRow[]; suffix?: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3">
          <span
            className={cx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-xl',
              r.toneClass ?? 'bg-surface-2 text-content-muted',
            )}
          >
            <r.Icon size={15} strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="truncate font-semibold text-content">{r.label}</span>
              <span className="shrink-0 font-bold tabular text-content">
                {r.count}
                {suffix && <span className="ml-0.5 font-normal text-content-subtle">{suffix}</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cx('h-full rounded-full', r.colorClass)}
                style={{ width: `${(r.count / max) * 100}%`, transition: 'width 0.3s ease' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
