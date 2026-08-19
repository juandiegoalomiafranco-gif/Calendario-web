import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarOff, Clock, MapPin, Plus, Settings2 } from 'lucide-react'
import { resolveDay } from '../lib/school'
import { useSchoolConfig, useSchoolSetup, useTasks } from '../hooks/useSchool'
import { useSchoolDay } from '../hooks/useSchoolDay'
import { formatFull, todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { UrgentTasksCard } from '../components/panels/UrgentTasksCard'
import { AddItemSheet } from '../components/school/AddItemSheet'

const CYCLE_DAYS = [1, 2, 3, 4, 5, 6]

/** Horario del colegio: el día de hoy y la rejilla completa del ciclo de 6 días. */
export function Colegio() {
  const iso = todayIso()
  const { setCycleDayOn } = useSchoolConfig()
  const { setup } = useSchoolSetup()
  const { cycle } = useSchoolDay(iso)
  const { tasks } = useTasks()

  const [selectedDay, setSelectedDay] = useState<number>(cycle.cycleDay ?? 1)
  const [fixing, setFixing] = useState(false)
  const [addingFor, setAddingFor] = useState<string | null>(null)

  // El horario de muestra usa las horas de HOY (el miércoles son más cortas).
  const slots = useMemo(() => resolveDay(setup, selectedDay, iso), [setup, selectedDay, iso])

  /** Pendientes abiertos por materia, para avisar en la propia fila del horario. */
  const openByClass = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tasks) {
      if (t.done || !t.classCode) continue
      m.set(t.classCode, (m.get(t.classCode) ?? 0) + 1)
    }
    return m
  }, [tasks])

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={formatFull(iso)}
        title="Colegio"
        actions={
          <Link
            to="/materias"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-content transition-colors hover:bg-surface-2"
          >
            <Settings2 size={15} aria-hidden />
            Materias y horario
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Tarjeta de hoy */}
        <div className="rounded-3xl bg-primary p-5 text-primary-on shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Hoy es</p>
          {cycle.schoolDay && cycle.cycleDay ? (
            <>
              <p className="text-4xl font-extrabold leading-tight tracking-tight">
                Día {cycle.cycleDay}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {resolveDay(setup, cycle.cycleDay, iso).filter((s) => s.kind === 'class' && s.classCode)
                  .length}{' '}
                clases
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold leading-tight tracking-tight">
                {cycle.reason ?? 'Sin colegio'}
              </p>
              <p className="mt-1 text-sm opacity-80">El ciclo no avanza hoy.</p>
            </>
          )}

          <button
            type="button"
            onClick={() => setFixing((v) => !v)}
            className="mt-4 inline-flex items-center rounded-full bg-primary-on/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary-on/25"
          >
            {fixing ? 'Cerrar' : '¿No es el día correcto?'}
          </button>

          {fixing && (
            <div className="mt-3 rounded-2xl bg-primary-on/10 p-3">
              <p className="mb-2 text-xs opacity-90">Hoy en realidad es el…</p>
              <div className="grid grid-cols-6 gap-1.5">
                {CYCLE_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setCycleDayOn(iso, d)
                      setSelectedDay(d)
                      setFixing(false)
                    }}
                    className="min-h-[40px] rounded-xl bg-primary-on/20 text-sm font-bold transition-colors hover:bg-primary-on/35"
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] opacity-70">Reinicia el ciclo desde hoy.</p>
            </div>
          )}
        </div>

        {/* Horario del día seleccionado */}
        <Card padding="none" className="overflow-hidden lg:col-span-2">
          <div className="border-b border-line p-4">
            <CardHeader
              title="Horario del ciclo"
              className="mb-0"
              action={
                <SegmentedControl
                  options={CYCLE_DAYS.map((d) => ({ value: String(d), label: String(d) }))}
                  value={String(selectedDay)}
                  onChange={(v) => setSelectedDay(Number(v))}
                  ariaLabel="Día del ciclo"
                />
              }
            />
          </div>

          {slots.length === 0 ? (
            <div className="flex items-center gap-2.5 p-5 text-sm text-content-muted">
              <CalendarOff size={17} className="text-content-subtle" aria-hidden />
              Este día del ciclo no tiene clases.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {slots.map((slot) => {
                if (slot.kind === 'break') {
                  return (
                    <li
                      key={slot.period}
                      className="flex items-center gap-3 bg-surface-2/60 px-4 py-2 text-xs text-content-muted"
                    >
                      <span className="w-24 shrink-0 tabular">
                        {slot.start}–{slot.end}
                      </span>
                      {slot.period}
                    </li>
                  )
                }

                const open = openByClass.get(slot.classCode) ?? 0
                const isNow = cycle.cycleDay === selectedDay

                return (
                  <li
                    key={slot.period}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <Link
                      to={
                        slot.classCode
                          ? `/colegio/clase/${encodeURIComponent(slot.classCode)}`
                          : '/materias'
                      }
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="w-24 shrink-0 text-xs tabular text-content-muted">
                        {slot.start}–{slot.end}
                      </span>
                      <span className={cx('h-9 w-1 shrink-0 rounded-full', slot.color.dot)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-content">
                          {slot.cls.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-content-muted">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} aria-hidden />
                            {slot.period}
                          </span>
                          {slot.room && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} aria-hidden />
                              {slot.room}
                            </span>
                          )}
                          {slot.cls.teacher && <span>{slot.cls.teacher}</span>}
                        </span>
                      </span>
                      {open > 0 && isNow && (
                        <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">
                          {open}
                        </span>
                      )}
                    </Link>

                    {/* Programar una tarea sin salir del horario */}
                    {slot.classCode && (
                      <button
                        type="button"
                        onClick={() => setAddingFor(slot.classCode)}
                        aria-label={`Añadir tarea de ${slot.cls.name}`}
                        title="Añadir tarea"
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 text-[11px] font-bold text-content-muted transition-colors hover:border-primary hover:text-content"
                      >
                        <Plus size={12} strokeWidth={2.6} aria-hidden />
                        Tarea
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 xl:hidden">
        <UrgentTasksCard limit={5} />
        <Card className="flex flex-col justify-center gap-3">
          <p className="text-sm text-content-muted">
            Programa tareas y exámenes clase por clase en los próximos días.
          </p>
          <Link
            to="/clases"
            className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-primary px-4 text-sm font-semibold text-primary-on transition-colors hover:bg-primary-hover"
          >
            Ver próximas clases
          </Link>
        </Card>
      </div>

      <AddItemSheet
        open={addingFor != null}
        onClose={() => setAddingFor(null)}
        classCode={addingFor ?? undefined}
        date={iso}
      />
    </div>
  )
}
