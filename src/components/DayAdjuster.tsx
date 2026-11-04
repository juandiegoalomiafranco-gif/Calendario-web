import { todayISO } from '../data/plan'
import { setDayOverride, useDayOverride } from '../lib/dayOverride'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function shift(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function label(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`)
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function DayAdjuster() {
  const override = useDayOverride()
  const iso = todayISO()

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between bg-card rounded-full shadow-card p-1.5">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-600"
          onClick={() => setDayOverride(shift(iso, -1))}
          aria-label="Día anterior"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-ink-700 capitalize">{label(iso)}</span>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-600"
          onClick={() => setDayOverride(shift(iso, 1))}
          aria-label="Día siguiente"
        >
          →
        </button>
      </div>
      {override ? (
        <p className="text-xs text-ink-400 text-center">
          Día ajustado a mano ·{' '}
          <button className="text-brand-400 font-medium underline" onClick={() => setDayOverride(null)}>
            Volver a la fecha automática
          </button>
        </p>
      ) : (
        <p className="text-xs text-ink-400 text-center">¿No es el día correcto? Ajústalo con las flechas.</p>
      )}
    </div>
  )
}
