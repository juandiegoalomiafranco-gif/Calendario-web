import { useMemo, useState } from 'react'
import { getRange } from '../data/plan'
import { WeekGrid } from '../components/WeekGrid'
import { useGoals } from '../hooks/useGoals'
import { addDays, formatShort, todayISO, weekStart } from '../lib/dates'

export function Week() {
  const iso = todayISO()
  const { activeGoal } = useGoals()
  // Semanas relativas a la actual: el plan se genera, así que no hay tope.
  const [offset, setOffset] = useState(0)

  const start = useMemo(() => addDays(weekStart(iso), offset * 7), [iso, offset])
  const end = useMemo(() => addDays(start, 6), [start])
  const days = useMemo(() => getRange(start, end, activeGoal), [start, end, activeGoal])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Semana</h1>
      </header>

      <div className="flex items-center justify-between bg-card rounded-full shadow-card p-1.5">
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center text-ink-600 active:bg-ink-100"
          onClick={() => setOffset((i) => i - 1)}
          aria-label="Semana anterior"
        >
          ←
        </button>
        <button
          className="flex flex-col items-center px-2 py-1 rounded-2xl active:bg-ink-100"
          onClick={() => setOffset(0)}
          aria-label="Volver a la semana actual"
        >
          <span className="text-sm font-semibold text-ink-700">
            {formatShort(start)} → {formatShort(end)}
          </span>
          {offset !== 0 && <span className="text-[11px] text-brand-600 font-medium">volver a hoy</span>}
        </button>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center text-ink-600 active:bg-ink-100"
          onClick={() => setOffset((i) => i + 1)}
          aria-label="Semana siguiente"
        >
          →
        </button>
      </div>

      <WeekGrid days={days} todayIso={iso} />
    </div>
  )
}
