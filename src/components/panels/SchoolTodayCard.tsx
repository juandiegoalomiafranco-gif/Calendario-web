import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarOff, MapPin } from 'lucide-react'
import { useNowAndNext } from '../../hooks/useSchoolDay'
import { useTasks } from '../../hooks/useSchool'
import { classesOnly } from '../../lib/school'
import { todayIso } from '../../lib/dates'
import { holidayName } from '../../data/holidays'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

/** Línea de tiempo de las clases de hoy, con la que está en curso resaltada. */
export function SchoolTodayCard({ className }: { className?: string }) {
  const iso = todayIso()
  const { current, slots, cycle } = useNowAndNext(iso, true)
  const { tasks } = useTasks()
  const classes = classesOnly(slots)
  const holiday = holidayName(iso)

  /** Pendientes sin terminar de esa materia, para avisar en la propia clase. */
  const openFor = (code: string) =>
    tasks.filter((t) => !t.done && t.classCode === code).length

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title="Colegio de hoy"
        action={
          <div className="flex items-center gap-2">
            {cycle.cycleDay && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-on">
                Día {cycle.cycleDay}
              </span>
            )}
            <Link
              to="/colegio"
              className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
            >
              Horario
              <ArrowUpRight size={13} aria-hidden />
            </Link>
          </div>
        }
      />

      {!cycle.schoolDay || classes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-2 py-8 text-center">
          <CalendarOff size={20} className="text-content-subtle" aria-hidden />
          <p className="text-sm text-content-muted">
            {holiday ? `Festivo · ${holiday}` : 'Hoy no hay colegio.'}
          </p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {classes.map((slot, i) => {
            const live = current?.period === slot.period
            const open = openFor(slot.classCode)
            return (
              <li key={slot.period} className="flex gap-3">
                {/* Eje de la línea de tiempo */}
                <div className="flex w-11 shrink-0 flex-col items-end pt-2.5">
                  <span
                    className={cx(
                      'text-[11px] font-bold tabular',
                      live ? 'text-content' : 'text-content-subtle',
                    )}
                  >
                    {slot.start}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className={cx(
                      'mt-3 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-surface',
                      live ? slot.color.dot : 'bg-line-strong',
                    )}
                  />
                  {i < classes.length - 1 && <span className="w-px flex-1 bg-line" />}
                </div>

                <Link
                  to={`/colegio/clase/${encodeURIComponent(slot.classCode)}`}
                  className={cx(
                    'mb-1.5 flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 transition-colors',
                    live ? slot.color.soft : 'hover:bg-surface-2',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-content">
                        {slot.cls.name}
                      </span>
                      {live && (
                        <span className="shrink-0 rounded-full bg-content px-1.5 py-0.5 text-[9px] font-bold uppercase text-surface">
                          Ahora
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-content-muted">
                      <span className="tabular">{slot.period}</span>
                      {slot.room && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} aria-hidden />
                          {slot.room}
                        </span>
                      )}
                    </span>
                  </span>
                  {open > 0 && (
                    <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">
                      {open}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
