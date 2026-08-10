import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ACTIVITIES } from '../../data/activityMeta'
import { activityKeysOn, isInPlan } from '../../lib/planQuery'
import {
  addMonths,
  dayNumber,
  formatMonthYear,
  isSameMonth,
  monthMatrix,
  startOfMonth,
  WEEKDAY_INITIAL,
} from '../../lib/dates'
import { cx } from '../../lib/cx'
import { useActivityFilter } from '../../hooks/useActivityFilter'

interface MiniCalendarProps {
  /** Día seleccionado. */
  value: string
  onSelect: (date: string) => void
  todayIso: string
  className?: string
}

/** Calendario de mes compacto con puntos de actividad — barra lateral y móvil. */
export function MiniCalendar({ value, onSelect, todayIso, className }: MiniCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(value))
  const { isVisible } = useActivityFilter()

  // Si la selección salta a otro mes (p. ej. al pulsar "Hoy"), seguimos ese mes.
  useEffect(() => {
    setMonth((m) => (isSameMonth(m, value) ? m : startOfMonth(value)))
  }, [value])

  const weeks = monthMatrix(month)

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-content">
          {formatMonthYear(month)}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Mes anterior"
            className="grid h-7 w-7 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Mes siguiente"
            className="grid h-7 w-7 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_INITIAL.map((d, i) => (
          <span
            key={i}
            className="pb-1 text-center text-[10px] font-medium uppercase text-content-subtle"
          >
            {d}
          </span>
        ))}

        {weeks.flat().map((date) => {
          const outside = !isSameMonth(date, month)
          const isToday = date === todayIso
          const selected = date === value
          const planned = isInPlan(date)
          const dots = activityKeysOn(date).filter(isVisible).slice(0, 3)

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-label={date}
              aria-current={isToday ? 'date' : undefined}
              className={cx(
                'relative mx-auto grid h-8 w-8 place-items-center rounded-full text-[13px] transition-colors',
                outside && 'text-content-subtle/60',
                !outside && !selected && 'text-content hover:bg-surface-2',
                selected && 'bg-brand font-semibold text-brand-on',
                !selected && isToday && 'font-bold text-brand ring-1 ring-brand',
                !planned && !selected && !isToday && 'text-content-subtle',
              )}
            >
              {dayNumber(date)}
              {dots.length > 0 && (
                <span className="absolute -bottom-0.5 flex gap-[2px]">
                  {dots.map((key) => (
                    <span
                      key={key}
                      className={cx(
                        'h-1 w-1 rounded-full',
                        selected ? 'bg-brand-on/80' : ACTIVITIES[key].dot,
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
