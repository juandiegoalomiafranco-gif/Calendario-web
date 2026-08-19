import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookMarked, NotebookPen, Plus, Star, Trash2 } from 'lucide-react'
import { colorOf } from '../data/palette'
import { useClassNotes, useSchoolSetup, useTasks } from '../hooks/useSchool'
import { htmlToText } from '../lib/richText'
import { todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { AddItemSheet } from '../components/school/AddItemSheet'
import { TaskItem } from '../components/tasks/TaskItem'

type Tab = 'notas' | 'tareas'

const SIN_UNIDAD = 'Sin unidad'

/** Ficha de una materia: sus notas por unidad y sus pendientes. */
export function ClassDetail() {
  const { code } = useParams()
  const classCode = code ? decodeURIComponent(code) : ''
  const { setup, removeUnit } = useSchoolSetup()
  const cls = setup.classes[classCode]

  const { notes, removeNote } = useClassNotes(classCode)
  const { tasks, toggleTask, removeTask } = useTasks(classCode)
  const [tab, setTab] = useState<Tab>('notas')
  const [unitFilter, setUnitFilter] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  /** Las unidades de la materia más las que ya usan las notas. */
  const units = useMemo(() => {
    const set = new Set<string>(cls?.units ?? [])
    for (const n of notes) if (n.unit.trim()) set.add(n.unit.trim())
    return [...set]
  }, [cls, notes])

  const shown = useMemo(
    () => (unitFilter ? notes.filter((n) => (n.unit.trim() || SIN_UNIDAD) === unitFilter) : notes),
    [notes, unitFilter],
  )

  const notesByUnit = useMemo(() => {
    const groups = new Map<string, typeof notes>()
    for (const n of [...shown].sort((a, b) => b.date.localeCompare(a.date))) {
      const key = n.unit.trim() || SIN_UNIDAD
      groups.set(key, [...(groups.get(key) ?? []), n])
    }
    return Array.from(groups.entries())
  }, [shown])

  const openTasks = tasks.filter((t) => !t.done).length

  if (!cls) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-content-muted">No encontramos esa materia.</p>
        <Link
          to="/colegio"
          className="inline-flex items-center gap-1.5 self-start font-semibold text-content"
        >
          <ArrowLeft size={16} aria-hidden /> Volver a Colegio
        </Link>
      </div>
    )
  }

  const color = colorOf(cls.color)
  const base = `/colegio/clase/${encodeURIComponent(classCode)}`

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={
          <Link to="/colegio" className="inline-flex items-center gap-1 hover:text-content">
            <ArrowLeft size={14} aria-hidden /> Colegio
          </Link>
        }
        title={cls.name}
        actions={
          <>
            <SegmentedControl
              options={[
                { value: 'notas', label: `Notas (${notes.length})` },
                { value: 'tareas', label: `Pendientes (${openTasks})` },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="Qué ver de la materia"
            />
            {tab === 'notas' ? (
              <Link
                to={`${base}/nota/nueva`}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[13px] font-semibold text-primary-on transition-colors hover:bg-primary-hover"
              >
                <Plus size={15} aria-hidden />
                Nota
              </Link>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setAddingTask(true)}>
                <Plus size={15} aria-hidden />
                Añadir tarea
              </Button>
            )}
          </>
        }
      >
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <span className={cx('h-2.5 w-2.5 rounded-full', color.dot)} />
          {cls.teacher ? `Profe ${cls.teacher}` : 'Sin profesor'} · {cls.code}
        </div>
      </PageHeader>

      {tab === 'notas' ? (
        <div className="flex flex-col gap-5">
          {/* Filtro por unidad */}
          {units.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setUnitFilter('')}
                aria-pressed={unitFilter === ''}
                className={cx(
                  'h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors',
                  unitFilter === ''
                    ? 'bg-primary text-primary-on'
                    : 'bg-surface-2 text-content-muted',
                )}
              >
                Todas
              </button>
              {units.map((u) => (
                <span key={u} className="group relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setUnitFilter(unitFilter === u ? '' : u)}
                    aria-pressed={unitFilter === u}
                    className={cx(
                      'h-8 rounded-full px-3 text-[13px] font-semibold transition-colors',
                      unitFilter === u
                        ? 'bg-primary text-primary-on'
                        : 'bg-surface-2 text-content-muted',
                    )}
                  >
                    {u}
                  </button>
                  {(cls.units ?? []).includes(u) && (
                    <button
                      type="button"
                      onClick={() => {
                        removeUnit(classCode, u)
                        if (unitFilter === u) setUnitFilter('')
                      }}
                      aria-label={`Quitar la unidad ${u}`}
                      title={`Quitar la unidad ${u}`}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-on-solid group-hover:grid"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {notesByUnit.length === 0 && (
            <Card className="flex flex-col items-center gap-2 py-10 text-center">
              <NotebookPen size={22} className="text-content-subtle" aria-hidden />
              <p className="text-sm text-content-muted">Aún no hay notas en esta materia.</p>
              <Link
                to={`${base}/nota/nueva`}
                className="text-sm font-semibold text-content underline"
              >
                Escribir la primera
              </Link>
            </Card>
          )}

          {notesByUnit.map(([unit, list]) => (
            <section key={unit} className="flex flex-col gap-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-content-subtle">
                {unit} · {list.length}
              </p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {list.map((n) => (
                  <Card key={n.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`${base}/nota/${n.id}`}
                        className="text-[15px] font-bold text-content hover:underline"
                      >
                        {n.title || 'Nota'}
                      </Link>
                      {n.important && (
                        <Star
                          size={15}
                          className="shrink-0 fill-current text-warn"
                          aria-label="Importante"
                        />
                      )}
                    </div>
                    {n.body && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-content-muted">
                        {htmlToText(n.body)}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-content-subtle">
                      <span className="tabular">{n.date}</span>
                      {n.notebookPage && (
                        <span className="inline-flex items-center gap-1">
                          <BookMarked size={11} aria-hidden />
                          Pág. {n.notebookPage}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNote(n.id)}
                        aria-label={`Eliminar nota ${n.title || ''}`}
                        className="ml-auto text-content-subtle transition-colors hover:text-danger"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tasks.length === 0 && (
            <Card className="flex flex-col items-center gap-2 py-10 text-center">
              <NotebookPen size={22} className="text-content-subtle" aria-hidden />
              <p className="text-sm text-content-muted">Aún no hay pendientes en esta materia.</p>
            </Card>
          )}
          {[...tasks]
            .sort(
              (a, b) =>
                Number(a.done) - Number(b.done) ||
                (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
            )
            .map((t) => (
              <div key={t.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <TaskItem task={t} onToggle={toggleTask} hideClass />
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

      <AddItemSheet
        open={addingTask}
        onClose={() => setAddingTask(false)}
        classCode={classCode}
        date={todayIso()}
      />
    </div>
  )
}
