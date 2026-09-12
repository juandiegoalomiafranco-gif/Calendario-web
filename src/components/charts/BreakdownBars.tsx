interface Row {
  key: string
  emoji: string
  label: string
  /** Valor numérico que define el largo de la barra. */
  value: number
  /** Texto que se muestra a la derecha (por ejemplo el monto formateado). */
  display: string
  colorClass: string
}

interface BreakdownBarsProps {
  rows: Row[]
  /** Descripción para lectores de pantalla. */
  label?: string
}

export function BreakdownBars({ rows, label }: BreakdownBarsProps) {
  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3" role="list" aria-label={label}>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2.5" role="listitem">
          <span className="w-6 text-center text-lg shrink-0" aria-hidden>
            {r.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
              <span className="font-medium text-ink-800 truncate">{r.label}</span>
              <span className="font-semibold text-ink-900 tabular-nums shrink-0">{r.display}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${r.colorClass}`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
