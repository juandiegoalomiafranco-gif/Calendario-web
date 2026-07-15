import { useMemo, useState } from 'react'
import { PLAN, todayISO } from '../data/plan'
import { WeekGrid } from '../components/WeekGrid'

function chunkIntoWeeks<T extends { date: string }>(days: T[]): T[][] {
  const weeks: T[][] = []
  let current: T[] = []
  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay()
    if (weekday === 1 && current.length) {
      weeks.push(current)
      current = []
    }
    current.push(day)
  }
  if (current.length) weeks.push(current)
  return weeks
}

export function Week() {
  const iso = todayISO()
  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])
  const currentWeekIdx = useMemo(() => {
    const idx = weeks.findIndex((w) => w.some((d) => d.date === iso))
    return idx >= 0 ? idx : 0
  }, [weeks, iso])
  const [weekIdx, setWeekIdx] = useState(currentWeekIdx)

  const week = weeks[weekIdx] ?? []

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Semana</h1>
      </header>

      <div className="flex items-center justify-between bg-white rounded-full shadow-card p-1.5">
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-600 disabled:opacity-30"
          onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
          disabled={weekIdx === 0}
          aria-label="Semana anterior"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-ink-700">
          {week[0]?.date} → {week[week.length - 1]?.date}
        </span>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-600 disabled:opacity-30"
          onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIdx === weeks.length - 1}
          aria-label="Semana siguiente"
        >
          →
        </button>
      </div>

      <WeekGrid days={week} todayIso={iso} />
    </div>
  )
}
