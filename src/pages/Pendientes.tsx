import { useMemo, useState } from 'react'
import { ListChecks, PartyPopper, Plus, Trash2 } from 'lucide-react'
import { useSchoolSetup, useTasks } from '../hooks/useSchool'
import {
  PERSONAL_AREA_META,
  PERSONAL_AREA_ORDER,
  TASK_KIND_META,
  TASK_KIND_ORDER,
  URGENCY_META,
  URGENCY_ORDER,
  type Task,
  type TaskScope,
} from '../data/schoolTypes'
import { classList } from '../lib/school'
import { todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { AddItemSheet } from '../components/school/AddItemSheet'
import { TaskItem } from '../components/tasks/TaskItem'
import { sortByPressure } from '../components/panels/UrgentTasksCard'

type Filter = 'abiertos' | 'hoy' | 'semana' | 'hechos'
type Scope = TaskScope | 'todo'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'abiertos', label: 'Abiertos' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'hechos', label: 'Hechos' },
]

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'colegio', label: 'Colegio' },
  { value: 'personal', label: 'Personal' },
  { value: 'todo', label: 'Todo' },
]

/**
 * Todos los pendientes en un solo sitio: lo del colegio (tareas, exámenes, quices y
 * entregas por materia) y lo personal de la casa, cada uno en su pestaña y con la
 * opción de verlo todo junto.
 */
export function Pendientes() {
  const today = todayIso()
  const { tasks, toggleTask, removeTask } = useTasks()
  const { setup } = useSchoolSetup()
  const [filter, setFilter] = useState<Filter>('abiertos')
  const [scope, setScope] = useState<Scope>('colegio')
  const [classFilter, setClassFilter] = useState<string>('')
  const [areaFilter, setAreaFilter] = useState<string>('')
  const [adding, setAdding] = useState(false)

  const classes = classList(setup)
  const weekLimit = useMemo(() => {
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [today])

  const shown = useMemo(() => {
    let list = tasks
    if (scope !== 'todo') list = list.filter((t) => t.scope === scope)
    if (scope === 'colegio' && classFilter) list = list.filter((t) => t.classCode === classFilter)
    if (scope === 'personal' && areaFilter) list = list.filter((t) => t.area === areaFilter)
    switch (filter) {
      case 'abiertos':
        list = list.filter((t) => !t.done)
        break
      case 'hoy':
        list = list.filter((t) => !t.done && t.dueDate === today)
        break
      case 'semana':
        list = list.filter((t) => !t.done && t.dueDate && t.dueDate <= weekLimit)
        break
      case 'hechos':
        list = list.filter((t) => t.done)
        break
    }
    return sortByPressure(list, today)
  }, [tasks, filter, scope, classFilter, areaFilter, today, weekLimit])

  /** Cuántos abiertos hay de cada tipo, para el resumen de arriba. */
  const byKind = useMemo(() => {
    const m = new Map<Task['kind'], number>()
    for (const t of tasks) {
      if (t.done || t.scope === 'personal') continue
      m.set(t.kind, (m.get(t.kind) ?? 0) + 1)
    }
    return m
  }, [tasks])

  /** Lo mismo para las áreas de casa. */
  const byArea = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tasks) {
      if (t.done || t.scope !== 'personal') continue
      const a = t.area ?? 'otro'
      m.set(a, (m.get(a) ?? 0) + 1)
    }
    return m
  }, [tasks])

  const visibles = scope === 'todo' ? tasks : tasks.filter((t) => t.scope === scope)
  const overdue = visibles.filter((t) => !t.done && t.dueDate && t.dueDate < today).length

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={overdue > 0 ? `${overdue} vencidos` : 'Todo bajo control'}
        title="Pendientes"
        actions={
          <>
            <SegmentedControl
              options={SCOPES}
              value={scope}
              onChange={setScope}
              ariaLabel="Colegio o personal"
            />
            <SegmentedControl
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filtrar pendientes"
            />
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              <Plus size={15} aria-hidden />
              Añadir
            </Button>
          </>
        }
      />

      {/* Resumen: tipos en Colegio, áreas en Personal */}
      {scope !== 'personal' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TASK_KIND_ORDER.map((k) => {
            const meta = TASK_KIND_META[k]
            return (
              <Card key={k} className="flex items-center gap-3">
                <span
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    meta.color.soft,
                  )}
                >
                  <meta.Icon size={17} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold tabular leading-none text-content">
                    {byKind.get(k) ?? 0}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-content-muted">{meta.label}</p>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PERSONAL_AREA_ORDER.slice(0, 4).map((a) => {
            const meta = PERSONAL_AREA_META[a]
            return (
              <Card key={a} className="flex items-center gap-3">
                <span
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    meta.color.soft,
                  )}
                >
                  <meta.Icon size={17} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold tabular leading-none text-content">
                    {byArea.get(a) ?? 0}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-content-muted">{meta.label}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filtro por área, en los personales */}
      {scope === 'personal' && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setAreaFilter('')}
            aria-pressed={areaFilter === ''}
            className={cx(
              'h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors',
              areaFilter === '' ? 'bg-primary text-primary-on' : 'bg-surface-2 text-content-muted',
            )}
          >
            Todas
          </button>
          {PERSONAL_AREA_ORDER.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAreaFilter(areaFilter === a ? '' : a)}
              aria-pressed={areaFilter === a}
              className={cx(
                'h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors',
                areaFilter === a ? 'bg-primary text-primary-on' : 'bg-surface-2 text-content-muted',
              )}
            >
              {PERSONAL_AREA_META[a].label}
            </button>
          ))}
        </div>
      )}

      {/* Filtro por materia */}
      {scope !== 'personal' && classes.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setClassFilter('')}
            aria-pressed={classFilter === ''}
            className={cx(
              'h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors',
              classFilter === '' ? 'bg-primary text-primary-on' : 'bg-surface-2 text-content-muted',
            )}
          >
            Todas
          </button>
          {classes.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setClassFilter(classFilter === c.code ? '' : c.code)}
              aria-pressed={classFilter === c.code}
              className={cx(
                'h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors',
                classFilter === c.code
                  ? 'bg-primary text-primary-on'
                  : 'bg-surface-2 text-content-muted',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          {filter === 'hechos' ? (
            <ListChecks size={24} className="text-content-subtle" aria-hidden />
          ) : (
            <PartyPopper size={24} className="text-content-subtle" aria-hidden />
          )}
          <p className="text-sm text-content-muted">
            {filter === 'hechos'
              ? 'Aún no has completado nada.'
              : scope === 'personal'
                ? 'Nada pendiente en la casa. Añade lo que tengas que hacer.'
                : 'No tienes nada pendiente aquí.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => (
            <div key={t.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <TaskItem task={t} onToggle={toggleTask} />
              </div>
              <button
                type="button"
                onClick={() => removeTask(t.id)}
                aria-label={`Eliminar ${t.title}`}
                className="mt-3 shrink-0 text-content-subtle transition-colors hover:text-danger"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda de urgencias */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-content-muted">
        {URGENCY_ORDER.map((u) => (
          <span key={u} className="inline-flex items-center gap-1.5">
            <span className={cx('h-2 w-2 rounded-full', URGENCY_META[u].color.dot)} />
            {URGENCY_META[u].label}
          </span>
        ))}
      </div>

      <AddItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        classCode={scope === 'colegio' ? classFilter || undefined : undefined}
        initialScope={scope === 'todo' ? 'colegio' : scope}
        date={today}
      />
    </div>
  )
}
