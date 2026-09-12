import { currentMonth, formatMonth, shiftMonth } from '../lib/dates'

interface MonthNavProps {
  month: string
  onChange: (month: string) => void
}

/** Navegador de mes con botón para volver al actual — el que le faltaba a "Semana". */
export function MonthNav({ month, onChange }: MonthNavProps) {
  const isCurrent = month === currentMonth()

  return (
    <div className="flex items-center justify-between bg-card rounded-full shadow-card p-1.5 gap-1">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="w-10 h-10 rounded-full flex items-center justify-center text-ink-600 active:bg-ink-100"
        aria-label="Mes anterior"
      >
        <span aria-hidden>←</span>
      </button>

      <span className="text-sm font-semibold text-ink-800 capitalize flex-1 text-center">
        {formatMonth(month)}
      </span>

      {isCurrent ? (
        <button
          type="button"
          onClick={() => onChange(shiftMonth(month, 1))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-ink-600 disabled:opacity-30"
          aria-label="Mes siguiente"
          disabled
        >
          <span aria-hidden>→</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(currentMonth())}
            className="min-h-[40px] px-3 rounded-full text-xs font-semibold text-brand-300 active:bg-brand-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onChange(shiftMonth(month, 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink-600 active:bg-ink-100"
            aria-label="Mes siguiente"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
