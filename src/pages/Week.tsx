import { useMemo, useState } from 'react'
import { PLAN, todayISO } from '../data/plan'
import { WeekGrid } from '../components/WeekGrid'
import { chunkIntoWeeks } from '../lib/weeks'
import { formatWeekRange } from '../lib/dates'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons'

export function Week() {
  const iso = todayISO()
  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])
  const currentWeekIdx = useMemo(() => {
    const idx = weeks.findIndex((w) => w.some((d) => d.date === iso))
    return idx >= 0 ? idx : 0
  }, [weeks, iso])
  const [weekIdx, setWeekIdx] = useState(currentWeekIdx)

  const week = weeks[weekIdx] ?? []
  const isCurrentWeek = weekIdx === currentWeekIdx

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-900">Semana</h1>
        {!isCurrentWeek && (
          <button
            onClick={() => setWeekIdx(currentWeekIdx)}
            className="min-h-[40px] rounded-full bg-ink-100 px-4 text-sm font-semibold text-brand-300 transition-colors active:bg-ink-200"
          >
            Hoy
          </button>
        )}
      </header>

      <div className="flex items-center justify-between gap-2 bg-card rounded-full shadow-card p-1.5">
        <button
          className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-ink-600 transition-colors active:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none"
          onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
          disabled={weekIdx === 0}
          aria-label="Semana anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-800 tabular-nums">
            {week.length ? formatWeekRange(week[0].date, week[week.length - 1].date) : ''}
          </p>
          <p className="text-[11px] text-ink-400 tabular-nums">
            Semana {weekIdx + 1} de {weeks.length}
          </p>
        </div>
        <button
          className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-ink-600 transition-colors active:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none"
          onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIdx === weeks.length - 1}
          aria-label="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <WeekGrid days={week} todayIso={iso} />
    </div>
  )
}
