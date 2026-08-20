import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  PartyPopper,
} from 'lucide-react'
import { getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import { EVENT_TYPE_META, useCalendarEvents, type CalendarEvent } from '../hooks/useCalendarEvents'
import { useTasks } from '../hooks/useSchool'
import { useSchoolSetup } from '../hooks/useSchool'
import { TASK_KIND_META, URGENCY_META } from '../data/schoolTypes'
import { colorOf } from '../data/palette'
import {
  addMonths,
  dayNumber,
  formatFull,
  formatMonthYear,
  isSameMonth,
  monthMatrix,
  relativeDay,
  startOfMonth,
  todayIso,
  WEEKDAY_SHORT,
} from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { EventSheet } from '../components/calendar/EventSheet'

/** Cuántos distintivos caben en una celda antes de resumir con «+N». */
const MAX_MARKS = 3

/**
 * Calendario de MyLife. Aquí sólo se crean **eventos y actividades** — los entrenos
 * no se registran desde aquí. Las tareas y exámenes que vencen, el entreno del día y
 * los festivos aparecen como información. Las clases viven en su propia sección.
 */
export function Calendario() {
  const today = todayIso()
  const [params, setParams] = useSearchParams()
  const selected = params.get('d') ?? today
  const [month, setMonth] = useState(() => startOfMonth(selected))
  const [sheet, setSheet] = useState<{ open: boolean; event?: CalendarEvent | null }>({
    open: false,
  })

  const { events } = useCalendarEvents()
  const { tasks, toggleTask } = useTasks()
  const { setup } = useSchoolSetup()

  const weeks = useMemo(() => monthMatrix(month), [month])

  /** Todo lo que hay que pintar en cada día del mes, indexado por fecha. */
  const byDate = useMemo(() => {
    const map = new Map<
      string,
      { events: CalendarEvent[]; tasks: typeof tasks; important: boolean }
    >()
    const ensure = (d: string) => {
      let entry = map.get(d)
      if (!entry) {
        entry = { events: [], tasks: [], important: false }
        map.set(d, entry)
      }
      return entry
    }
    for (const e of events) {
      const entry = ensure(e.date)
      entry.events.push(e)
      if (e.important) entry.important = true
    }
    for (const t of tasks) {
      if (!t.dueDate || t.done) continue
      ensure(t.dueDate).tasks.push(t)
    }
    return map
  }, [events, tasks])

  function selectDay(date: string) {
    setParams(date === today ? {} : { d: date }, { replace: true })
    if (!isSameMonth(date, month)) setMonth(startOfMonth(date))
  }

  function goToday() {
    setMonth(startOfMonth(today))
    setParams({}, { replace: true })
  }

  // --- Agenda del día seleccionado ------------------------------------------
  const dayEvents = events
    .filter((e) => e.date === selected)
    .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
  const dayTasks = tasks.filter((t) => t.dueDate === selected)
  const daySessions = (getDayPlan(selected)?.sessions ?? []).filter((s) => s.type !== 'rest')
  const dayHoliday = holidayName(selected)
  const isEmpty =
    dayEvents.length === 0 && dayTasks.length === 0 && daySessions.length === 0 && !dayHoliday

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Tus eventos y fechas importantes"
        title={formatMonthYear(month)}
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Mes anterior"
              >
                <ChevronLeft size={18} aria-hidden />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday}>
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Mes siguiente"
              >
                <ChevronRight size={18} aria-hidden />
              </Button>
            </div>
            <Button variant="primary" size="sm" onClick={() => setSheet({ open: true })}>
              <CalendarPlus size={15} aria-hidden />
              Nuevo evento
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-5">
        {/* Rejilla del mes */}
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAY_SHORT.map((d) => (
              <div
                key={d}
                className="px-2 py-2.5 text-center text-[11px] font-bold uppercase text-content-subtle"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weeks.flat().map((date, i) => {
              const outside = !isSameMonth(date, month)
              const isToday = date === today
              const isSelected = date === selected
              const entry = byDate.get(date)
              const holiday = holidayName(date)
              const hasTraining = (getDayPlan(date)?.sessions ?? []).some((s) => s.type !== 'rest')

              const marks = [
                ...(entry?.events ?? []).map((e) => ({
                  key: e.id,
                  label: e.title,
                  color: (EVENT_TYPE_META[e.type] ?? EVENT_TYPE_META.otro).color,
                })),
                ...(entry?.tasks ?? []).map((t) => ({
                  key: t.id,
                  label: t.title,
                  color: URGENCY_META[t.urgency].color,
                })),
              ]

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => selectDay(date)}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={formatFull(date)}
                  className={cx(
                    // En el celular las celdas llevan puntos, no títulos, así que no
                    // necesitan 5,5rem: con 3 el mes entero cabe y queda sitio debajo
                    // para el detalle del día. De sm en adelante vuelven los títulos.
                    'flex min-h-[3rem] flex-col items-stretch gap-1 border-line p-1.5 text-left transition-colors sm:min-h-[5.5rem] lg:min-h-[7.5rem]',
                    i % 7 !== 0 && 'border-l',
                    i >= 7 && 'border-t',
                    outside && 'bg-surface-2/50',
                    !isSelected && 'hover:bg-surface-2',
                    isSelected && 'ring-2 ring-inset ring-primary',
                  )}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={cx(
                        'grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-bold tabular',
                        isToday
                          ? 'bg-primary text-primary-on'
                          : outside
                            ? 'text-content-subtle/60'
                            : 'text-content',
                      )}
                    >
                      {dayNumber(date)}
                    </span>
                    {entry?.important && (
                      <Bookmark
                        size={12}
                        strokeWidth={2.5}
                        className="fill-current text-accent"
                        aria-label="Evento importante"
                      />
                    )}
                    {holiday && (
                      <PartyPopper size={11} className="text-warn" aria-label={`Festivo: ${holiday}`} />
                    )}
                    {hasTraining && (
                      <Dumbbell
                        size={11}
                        className="ml-auto text-content-subtle"
                        aria-label="Hay entreno"
                      />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-col gap-0.5">
                    {/*
                     * En el celular la celda mide unos 50 px de ancho: un título
                     * recortado ahí no se lee («Whole S…»), solo estorba. Se muestran
                     * puntos de color, que dicen «aquí hay algo y de qué tipo», y el
                     * título completo aparece al tocar el día.
                     */}
                    {marks.length > 0 && (
                      <span className="flex flex-wrap items-center gap-1 sm:hidden">
                        {marks.slice(0, MAX_MARKS).map((m) => (
                          <span
                            key={m.key}
                            aria-hidden
                            className={cx('h-1.5 w-1.5 shrink-0 rounded-full', m.color.dot)}
                          />
                        ))}
                        {marks.length > MAX_MARKS && (
                          <span className="text-[10px] font-bold leading-none text-content-muted">
                            +{marks.length - MAX_MARKS}
                          </span>
                        )}
                        <span className="sr-only">{marks.map((m) => m.label).join(', ')}</span>
                      </span>
                    )}

                    <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                      {marks.slice(0, MAX_MARKS).map((m) => (
                        <span
                          key={m.key}
                          className={cx(
                            'truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight',
                            m.color.soft,
                          )}
                        >
                          {m.label}
                        </span>
                      ))}
                      {marks.length > MAX_MARKS && (
                        <span className="px-1.5 text-[10px] font-bold text-content-muted">
                          +{marks.length - MAX_MARKS} más
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Agenda del día seleccionado */}
        <Card className="flex flex-col self-start xl:sticky xl:top-[calc(4rem+1.75rem)]">
          <CardHeader
            title={selected === today ? 'Hoy' : formatFull(selected)}
            action={
              <span className="text-xs font-semibold text-content-subtle">
                {relativeDay(selected)}
              </span>
            }
          />

          {dayHoliday && (
            <p className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
              <PartyPopper size={13} aria-hidden />
              Festivo · {dayHoliday}
            </p>
          )}

          {isEmpty ? (
            <button
              type="button"
              onClick={() => setSheet({ open: true })}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-10 text-center transition-colors hover:bg-surface-2"
            >
              <CalendarPlus size={20} className="text-content-subtle" aria-hidden />
              <span className="text-sm text-content-muted">Nada agendado este día.</span>
              <span className="text-xs text-content-subtle">Toca para añadir un evento</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {dayEvents.map((e) => {
                const meta = EVENT_TYPE_META[e.type] ?? EVENT_TYPE_META.otro
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSheet({ open: true, event: e })}
                    className="flex items-start gap-3 rounded-2xl border border-line p-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                        meta.color.soft,
                      )}
                    >
                      <meta.Icon size={16} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cx(
                            'text-[11px] font-bold uppercase tracking-wide',
                            meta.color.text,
                          )}
                        >
                          {meta.label}
                        </span>
                        {e.important && (
                          <Bookmark
                            size={11}
                            className="fill-current text-accent"
                            aria-label="Importante"
                          />
                        )}
                        {e.time && (
                          <span className="ml-auto text-[11px] font-bold tabular text-content-muted">
                            {e.time}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-bold text-content">
                        {e.title}
                      </span>
                      {e.notes && (
                        <span className="mt-0.5 block line-clamp-2 text-xs text-content-muted">
                          {e.notes}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}

              {dayTasks.map((t) => {
                const kind = TASK_KIND_META[t.kind] ?? TASK_KIND_META.tarea
                const cls = t.classCode ? setup.classes[t.classCode] : undefined
                const color = cls ? colorOf(cls.color) : URGENCY_META[t.urgency].color
                return (
                  <div
                    key={t.id}
                    className={cx(
                      'flex items-center gap-3 rounded-2xl border border-line p-3',
                      t.done && 'opacity-60',
                    )}
                  >
                    <span
                      className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', color.soft)}
                    >
                      <kind.Icon size={16} strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
                        {kind.label}
                        {cls ? ` · ${cls.name}` : ''}
                      </p>
                      <p
                        className={cx(
                          'truncate text-sm font-bold text-content',
                          t.done && 'line-through',
                        )}
                      >
                        {t.title}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                      aria-label={`Marcar ${t.title}`}
                      className="h-5 w-5 shrink-0 rounded accent-ok"
                    />
                  </div>
                )
              })}

              {daySessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 p-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-content-muted">
                    <Dumbbell size={16} strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
                      Entreno
                    </p>
                    <p className="truncate text-sm font-bold text-content">{s.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="secondary"
            size="md"
            className="mt-3 w-full justify-center"
            onClick={() => setSheet({ open: true })}
          >
            <CalendarPlus size={16} aria-hidden />
            Añadir evento
          </Button>
        </Card>
      </div>

      <EventSheet
        open={sheet.open}
        onClose={() => setSheet({ open: false })}
        date={selected}
        event={sheet.event}
      />
    </div>
  )
}
