import { Link } from 'react-router-dom'
import type { DayPlan } from '../data/types'
import { SESSION_META } from '../data/sessionMeta'
import { holidayName } from '../data/holidays'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { HolidayBadge } from './HolidayBadge'
import { CheckIcon } from './icons'

interface WeekGridProps {
  days: DayPlan[]
  todayIso: string
}

export function WeekGrid({ days, todayIso }: WeekGridProps) {
  const { log } = useTrainingLog()

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
            className={`flex items-center gap-3 rounded-3xl p-3 shadow-card transition-colors bg-card active:bg-ink-100 ${
              isToday ? 'ring-2 ring-brand-500' : ''
            }`}
          >
            <div
              className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${
                isToday ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700'
              }`}
            >
              <span className="text-[10px] uppercase leading-none">{day.weekday.slice(0, 3)}</span>
              <span className="text-base font-bold leading-tight tabular-nums">{dayNum}</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
              {holiday && <HolidayBadge />}
              {day.sessions.map((s) => {
                const meta = SESSION_META[s.type]
                const done = !!log[s.id]?.completed
                return (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      done ? 'bg-ok-900 text-ok-300' : 'bg-ink-100 text-ink-700'
                    }`}
                  >
                    {done ? (
                      <CheckIcon className="w-3 h-3" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    )}
                    <span aria-hidden>{meta.emoji}</span> {s.summary}
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
