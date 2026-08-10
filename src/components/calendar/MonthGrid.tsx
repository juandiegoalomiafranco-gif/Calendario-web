import { activityKeyOf } from '../../data/activityMeta'
import { holidayName } from '../../data/holidays'
import type { Session } from '../../data/types'
import { useActivityFilter } from '../../hooks/useActivityFilter'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { sessionsOn } from '../../lib/planQuery'
import { dayNumber, isSameMonth, monthMatrix, WEEKDAY_SHORT } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { EventChip } from './EventBlock'

const MAX_CHIPS = 3

interface MonthGridProps {
  /** Cualquier fecha del mes a dibujar. */
  month: string
  todayIso: string
  selected: string
  onSelectDay: (date: string) => void
  onSelect: (session: Session, date: string) => void
}

/** Vista de mes: rejilla de 7 columnas con las sesiones resumidas en cada día. */
export function MonthGrid({ month, todayIso, selected, onSelectDay, onSelect }: MonthGridProps) {
  const { isVisible } = useActivityFilter()
  const { log } = useTrainingLog()
  const weeks = monthMatrix(month)

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-medium uppercase text-content-subtle">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((date, i) => {
          const outside = !isSameMonth(date, month)
          const isToday = date === todayIso
          const isSelected = date === selected
          const holiday = holidayName(date)
          const sessions = sessionsOn(date).filter((s) => isVisible(activityKeyOf(s.type)))
          const shown = sessions.slice(0, MAX_CHIPS)
          const extra = sessions.length - shown.length

          return (
            <div
              key={date}
              className={cx(
                'flex min-h-[7rem] flex-col gap-1 border-line p-1.5',
                i % 7 !== 0 && 'border-l',
                i >= 7 && 'border-t',
                outside && 'bg-surface-2/40',
                isSelected && 'ring-1 ring-inset ring-brand',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(date)}
                className="flex items-center gap-1.5 self-start"
              >
                <span
                  className={cx(
                    'grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold tabular transition-colors',
                    isToday
                      ? 'bg-brand text-brand-on'
                      : outside
                        ? 'text-content-subtle/70'
                        : 'text-content hover:bg-surface-2',
                  )}
                >
                  {dayNumber(date)}
                </span>
                {holiday && (
                  <span className="truncate text-[10px] font-medium text-brand" title={holiday}>
                    Festivo
                  </span>
                )}
              </button>

              <div className="flex flex-col gap-0.5">
                {shown.map((s) => (
                  <EventChip
                    key={s.id}
                    session={s}
                    completed={log[s.id]?.completed}
                    onSelect={(sess) => onSelect(sess, date)}
                  />
                ))}
                {extra > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(date)}
                    className="px-1.5 text-left text-[11px] font-medium text-content-muted hover:text-content"
                  >
                    +{extra} más
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
