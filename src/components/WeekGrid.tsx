import { Link } from 'react-router-dom'
import type { DayPlan } from '../data/types'
import { SESSION_META } from '../data/sessionMeta'
import { holidayName } from '../data/holidays'

interface WeekGridProps {
  days: DayPlan[]
  todayIso: string
}

export function WeekGrid({ days, todayIso }: WeekGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {days.map((day) => {
        const isToday = day.date === todayIso
        const dayNum = day.date.slice(8, 10)
        const holiday = holidayName(day.date)
        return (
          <Link
            key={day.date}
            to={`/dia/${day.date}`}
            className={`flex items-center gap-3 rounded-3xl p-3 shadow-card transition-colors bg-card ${
              isToday ? 'ring-2 ring-brand-500' : ''
            }`}
          >
            <div
              className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${
                isToday ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              <span className="text-[10px] uppercase leading-none">{day.weekday.slice(0, 3)}</span>
              <span className="text-base font-bold leading-tight">{dayNum}</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
              {holiday && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-200">
                  🇨🇴 Festivo
                </span>
              )}
              {day.sessions.map((s) => {
                const meta = SESSION_META[s.type]
                return (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-ink-100 text-ink-700"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.emoji} {s.summary}
                  </span>
                )
              })}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
