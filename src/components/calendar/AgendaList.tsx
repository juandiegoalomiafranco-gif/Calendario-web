import { CalendarOff } from 'lucide-react'
import { activityKeyOf } from '../../data/activityMeta'
import { holidayName } from '../../data/holidays'
import type { Session } from '../../data/types'
import { useActivityFilter } from '../../hooks/useActivityFilter'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { sessionsOn } from '../../lib/planQuery'
import { dayNumber, WEEKDAY_SHORT, weekdayIndex } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { EventRow } from './EventBlock'

interface AgendaListProps {
  days: string[]
  todayIso: string
  onSelect: (session: Session, date: string) => void
}

/** Lista de días seguidos con sus sesiones — la vista principal en móvil. */
export function AgendaList({ days, todayIso, onSelect }: AgendaListProps) {
  const { isVisible } = useActivityFilter()
  const { log } = useTrainingLog()

  const groups = days
    .map((date) => ({
      date,
      sessions: sessionsOn(date).filter((s) => isVisible(activityKeyOf(s.type))),
    }))
    .filter((g) => g.sessions.length > 0)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line py-10 text-center">
        <CalendarOff size={22} className="text-content-subtle" aria-hidden />
        <p className="text-sm text-content-muted">No hay sesiones en este rango.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ date, sessions }) => {
        const isToday = date === todayIso
        const holiday = holidayName(date)
        return (
          <div key={date} className="flex gap-3">
            <div className="w-11 shrink-0 pt-1 text-center">
              <p className="text-[11px] font-medium uppercase text-content-subtle">
                {WEEKDAY_SHORT[weekdayIndex(date)]}
              </p>
              <p
                className={cx(
                  'mx-auto mt-0.5 grid h-9 w-9 place-items-center rounded-full text-lg font-bold tabular',
                  isToday ? 'bg-brand text-brand-on' : 'text-content',
                )}
              >
                {dayNumber(date)}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {holiday && (
                <span className="self-start rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
                  Festivo · {holiday}
                </span>
              )}
              {sessions.map((s) => (
                <EventRow
                  key={s.id}
                  session={s}
                  completed={log[s.id]?.completed}
                  onSelect={(sess) => onSelect(sess, date)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
