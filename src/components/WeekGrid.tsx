import { Link } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import { SESSION_META } from '../data/sessionMeta'
import { holidayName } from '../data/holidays'
import type { DayPlan } from '../data/types'
import { cx } from '../lib/cx'

interface WeekGridProps {
  days: DayPlan[]
  todayIso: string
}

/** Lista de los días de una semana del plan de entrenamiento. */
export function WeekGrid({ days, todayIso }: WeekGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {days.map((day) => {
        const isToday = day.date === todayIso
        const holiday = holidayName(day.date)
        return (
          <Link
            key={day.date}
            to={`/dia/${day.date}`}
            className={cx(
              'flex items-center gap-3 rounded-3xl border bg-surface p-3 shadow-card transition-shadow hover:shadow-lg',
              isToday ? 'border-primary' : 'border-line',
            )}
          >
            <div
              className={cx(
                'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl',
                isToday ? 'bg-primary text-primary-on' : 'bg-surface-2 text-content',
              )}
            >
              <span className="text-[10px] uppercase leading-none">{day.weekday.slice(0, 3)}</span>
              <span className="text-base font-extrabold tabular leading-tight">
                {day.date.slice(8, 10)}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {holiday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                  <PartyPopper size={12} aria-hidden />
                  Festivo
                </span>
              )}
              {day.sessions.map((s) => {
                const meta = SESSION_META[s.type]
                return (
                  <span
                    key={s.id}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                      meta.color.soft,
                    )}
                  >
                    <meta.Icon size={12} strokeWidth={2.2} aria-hidden />
                    {s.summary}
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
