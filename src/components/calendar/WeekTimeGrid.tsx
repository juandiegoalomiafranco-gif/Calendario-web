import { useEffect, useRef, useState } from 'react'
import { activityKeyOf, activityOf } from '../../data/activityMeta'
import type { Session } from '../../data/types'
import { useActivityFilter } from '../../hooks/useActivityFilter'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { holidayName } from '../../data/holidays'
import { sessionsOn } from '../../lib/planQuery'
import { currentHour, GRID_END_HOUR, GRID_START_HOUR, sessionTimeRange } from '../../lib/schedule'
import { dayNumber, WEEKDAY_SHORT, weekdayIndex } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { EventBlock } from './EventBlock'

const HOUR_PX = 44
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i)

/** Eje de horas + una columna por día: sirve igual para la vista de semana y la de día. */
const template = (dayCount: number) => `3.5rem repeat(${dayCount}, minmax(0, 1fr))`

interface Placed {
  session: Session
  top: number
  height: number
  /** Fracción 0-1 del ancho de la columna. */
  left: number
  width: number
}

/**
 * Reparte las sesiones de un día en columnas para que dos que se solapan
 * queden lado a lado en vez de una encima de la otra.
 */
function layoutDay(sessions: Session[]): Placed[] {
  const timed = sessions
    .map((session) => ({ session, range: sessionTimeRange(session) }))
    .filter((x): x is { session: Session; range: NonNullable<ReturnType<typeof sessionTimeRange>> } =>
      Boolean(x.range),
    )
    .sort((a, b) => a.range.start - b.range.start)

  const placed: Placed[] = []
  let cluster: typeof timed = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (!cluster.length) return
    // Asignación voraz de columnas dentro del grupo que se solapa
    const columnEnds: number[] = []
    const columnOf = cluster.map(({ range }) => {
      let col = columnEnds.findIndex((end) => end <= range.start)
      if (col === -1) col = columnEnds.length
      columnEnds[col] = range.end
      return col
    })
    const total = columnEnds.length
    cluster.forEach(({ session, range }, i) => {
      placed.push({
        session,
        top: (range.start - GRID_START_HOUR) * HOUR_PX,
        height: Math.max((range.end - range.start) * HOUR_PX, 26),
        left: columnOf[i] / total,
        width: 1 / total,
      })
    })
    cluster = []
    clusterEnd = -Infinity
  }

  for (const item of timed) {
    if (item.range.start >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, item.range.end)
  }
  flush()

  return placed
}

interface WeekTimeGridProps {
  days: string[]
  todayIso: string
  onSelect: (session: Session, date: string) => void
}

/** Rejilla semanal con eje de horas, al estilo de un calendario de escritorio. */
export function WeekTimeGrid({ days, todayIso, onSelect }: WeekTimeGridProps) {
  const { isVisible } = useActivityFilter()
  const { log } = useTrainingLog()
  const [now, setNow] = useState(() => currentHour())
  const bodyRef = useRef<HTMLDivElement>(null)

  // La línea de "ahora" se refresca cada minuto
  useEffect(() => {
    const id = setInterval(() => setNow(currentHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Al abrir, centramos la vista en la mañana en vez de en las 5:00
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = (6 - GRID_START_HOUR) * HOUR_PX - 8
  }, [])

  const visible = (s: Session) => isVisible(activityKeyOf(s.type))
  const showNow = days.includes(todayIso) && now >= GRID_START_HOUR && now <= GRID_END_HOUR

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      {/* Encabezado de días */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: template(days.length) }}>
        <div />
        {days.map((date) => {
          const isToday = date === todayIso
          const holiday = holidayName(date)
          return (
            <div key={date} className="border-l border-line px-2 py-2.5 text-center">
              <p className="text-[11px] font-medium uppercase text-content-subtle">
                {WEEKDAY_SHORT[weekdayIndex(date)]}
              </p>
              <p
                className={cx(
                  'mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold tabular',
                  isToday ? 'bg-brand text-brand-on' : 'text-content',
                )}
              >
                {dayNumber(date)}
              </p>
              {holiday && (
                <p className="mt-1 truncate text-[10px] font-medium text-brand" title={holiday}>
                  Festivo
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Fila de todo el día */}
      <div className="grid border-b border-line bg-surface-2/40" style={{ gridTemplateColumns: template(days.length) }}>
        <div className="px-2 py-2 text-right text-[10px] font-medium leading-tight text-content-subtle">
          Todo el día
        </div>
        {days.map((date) => {
          const allDay = sessionsOn(date).filter((s) => !sessionTimeRange(s) && visible(s))
          return (
            <div key={date} className="min-h-[2.25rem] border-l border-line p-1">
              {allDay.map((s) => {
                const activity = activityOf(s.type)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s, date)}
                    className={cx(
                      'mb-0.5 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-opacity hover:opacity-80',
                      activity.soft,
                    )}
                  >
                    <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', activity.dot)} />
                    <span className="truncate text-[11px] font-medium">{s.summary}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Cuerpo con eje de horas */}
      <div
        ref={bodyRef}
        className="scroll-slim overflow-y-auto"
        style={{ maxHeight: `min(calc(100vh - 15.5rem), ${HOURS.length * HOUR_PX}px)` }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: template(days.length),
            height: HOURS.length * HOUR_PX,
          }}
        >
          {/* Eje de horas */}
          <div className="relative">
            {HOURS.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular text-content-subtle"
                style={{ top: i * HOUR_PX }}
              >
                {i === 0 ? '' : `${h}:00`}
              </span>
            ))}
          </div>

          {/* Una columna por día */}
          {days.map((date) => {
            const sessions = sessionsOn(date).filter(visible)
            const placed = layoutDay(sessions)
            const restDay = sessions.length > 0 && sessions.every((s) => s.type === 'rest')
            const isToday = date === todayIso

            return (
              <div
                key={date}
                className={cx(
                  'relative border-l border-line',
                  isToday && 'bg-brand-soft/40',
                  restDay && 'hatched',
                )}
                style={{
                  backgroundImage: 'linear-gradient(to bottom, rgb(var(--line)) 1px, transparent 1px)',
                  backgroundSize: `100% ${HOUR_PX}px`,
                }}
              >
                {placed.map(({ session, top, height, left, width }) => (
                  <EventBlock
                    key={session.id}
                    session={session}
                    completed={log[session.id]?.completed}
                    heightPx={height}
                    onSelect={(s) => onSelect(s, date)}
                    style={{
                      top,
                      height: height - 2,
                      left: `calc(${left * 100}% + 2px)`,
                      width: `calc(${width * 100}% - 4px)`,
                    }}
                  />
                ))}

                {showNow && isToday && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: (now - GRID_START_HOUR) * HOUR_PX }}
                    aria-hidden
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
