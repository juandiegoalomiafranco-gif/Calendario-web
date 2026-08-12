import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarOff, Clock, MapPin, Plus, Settings2 } from 'lucide-react'
import { cycleInfoFor } from '../lib/cycle'
import { classesOnly, resolveDay, type ResolvedSlot } from '../lib/school'
import { useSchoolConfig, useSchoolSetup, useTasks } from '../hooks/useSchool'
import { holidayName } from '../data/holidays'
import { TASK_KIND_META, type TaskKind } from '../data/schoolTypes'
import { addDays, formatFull, relativeDay, todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { AddItemSheet } from '../components/school/AddItemSheet'
import { TaskItem } from '../components/tasks/TaskItem'

/** Cuántos días vista se listan. */
const RANGES = [
  { value: '3', label: '3 días' },
  { value: '7', label: '1 semana' },
  { value: '14', label: '2 semanas' },
] as const

interface DayBlock {
  date: string
  cycleDay: number | null
  holiday?: string
  classes: ResolvedSlot[]
}

/**
 * «Clases»: las clases de hoy y de los próximos días. En cada una puedes programar
 * una tarea, un examen, un quiz o una entrega para esa fecha concreta — y eso
 * aparece luego en Pendientes y en el Calendario.
 */
export function Clases() {
  const today = todayIso()
  const { config } = useSchoolConfig()
  const { setup } = useSchoolSetup()
  const { tasks, toggleTask } = useTasks()

  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('7')
  const [adding, setAdding] = useState<{ classCode: string; date: string; kind: TaskKind } | null>(
    null,
  )

  const days = useMemo<DayBlock[]>(() => {
    const out: DayBlock[] = []
    for (let i = 0; i < Number(range); i++) {
      const date = addDays(today, i)
      const cycle = cycleInfoFor(date, config)
      out.push({
        date,
        cycleDay: cycle.cycleDay,
        holiday: holidayName(date),
        classes: classesOnly(resolveDay(setup, cycle.cycleDay)),
      })
    }
    return out
  }, [range, today, config, setup])

  /** Pendientes sin terminar de una materia con fecha en ese día o antes. */
  const itemsFor = (classCode: string, date: string) =>
    tasks.filter((t) => t.classCode === classCode && !t.done && t.dueDate === date)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Lo que viene"
        title="Clases"
        actions={
          <>
            <SegmentedControl
              options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
              value={range}
              onChange={setRange}
              ariaLabel="Cuántos días mostrar"
            />
            <Link
              to="/materias"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-content transition-colors hover:bg-surface-2"
            >
              <Settings2 size={15} aria-hidden />
              Materias
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        {days.map((day) => (
          <Card key={day.date} padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold capitalize text-content">
                  {formatFull(day.date)}
                </p>
                <p className="text-xs text-content-muted">
                  {day.date === today ? 'Hoy' : relativeDay(day.date)}
                  {day.cycleDay ? ` · Día ${day.cycleDay} del ciclo` : ''}
                </p>
              </div>
              {day.cycleDay && (
                <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-on">
                  Día {day.cycleDay}
                </span>
              )}
            </div>

            {day.classes.length === 0 ? (
              <div className="flex items-center gap-2.5 px-4 py-5 text-sm text-content-muted">
                <CalendarOff size={17} className="text-content-subtle" aria-hidden />
                {day.holiday ? `Festivo · ${day.holiday}` : 'Sin clases este día.'}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {day.classes.map((slot) => {
                  const items = itemsFor(slot.classCode, day.date)
                  return (
                    <li key={`${day.date}-${slot.period}`} className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <span className={cx('mt-0.5 h-10 w-1 shrink-0 rounded-full', slot.color.dot)} />

                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/colegio/clase/${encodeURIComponent(slot.classCode)}`}
                            className="block truncate text-[15px] font-bold text-content hover:underline"
                          >
                            {slot.cls.name}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-content-muted">
                            <span className="inline-flex items-center gap-1 tabular">
                              <Clock size={11} aria-hidden />
                              {slot.start}–{slot.end}
                            </span>
                            {slot.room && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={11} aria-hidden />
                                {slot.room}
                              </span>
                            )}
                            {slot.cls.teacher && <span>{slot.cls.teacher}</span>}
                          </p>
                        </div>

                        {/* Programar algo en esta clase, en esta fecha */}
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {(['tarea', 'examen'] as TaskKind[]).map((k) => {
                            const meta = TASK_KIND_META[k]
                            return (
                              <button
                                key={k}
                                type="button"
                                onClick={() =>
                                  setAdding({ classCode: slot.classCode, date: day.date, kind: k })
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-[11px] font-bold text-content-muted transition-colors hover:border-primary hover:text-content"
                              >
                                <Plus size={12} strokeWidth={2.6} aria-hidden />
                                {meta.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-2 pl-4">
                          {items.map((t) => (
                            <TaskItem key={t.id} task={t} onToggle={toggleTask} hideClass />
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <AddItemSheet
        open={adding != null}
        onClose={() => setAdding(null)}
        classCode={adding?.classCode}
        date={adding?.date}
        initialKind={adding?.kind}
      />
    </div>
  )
}
