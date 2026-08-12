import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookMarked, NotebookPen, Plus, Star, Trash2 } from 'lucide-react'
import { colorOf } from '../data/palette'
import { useClassNotes, useSchoolSetup, useTasks } from '../hooks/useSchool'
import { todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, TextArea, TextInput } from '../components/ui/Field'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Sheet } from '../components/ui/Sheet'
import { AddItemSheet } from '../components/school/AddItemSheet'
import { TaskItem } from '../components/tasks/TaskItem'

type Tab = 'notas' | 'tareas'

/** Ficha de una materia: sus notas por unidad y sus pendientes. */
export function ClassDetail() {
  const { code } = useParams()
  const classCode = code ? decodeURIComponent(code) : ''
  const { setup } = useSchoolSetup()
  const cls = setup.classes[classCode]

  const { notes, addNote, removeNote } = useClassNotes(classCode)
  const { tasks, toggleTask, removeTask } = useTasks(classCode)
  const [tab, setTab] = useState<Tab>('notas')
  const [addingNote, setAddingNote] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  const notesByUnit = useMemo(() => {
    const groups = new Map<string, typeof notes>()
    for (const n of [...notes].sort((a, b) => b.date.localeCompare(a.date))) {
      const key = n.unit.trim() || 'Sin unidad'
      groups.set(key, [...(groups.get(key) ?? []), n])
    }
    return Array.from(groups.entries())
  }, [notes])

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
            <Button
              variant="primary"
              size="sm"
              onClick={() => (tab === 'notas' ? setAddingNote(true) : setAddingTask(true))}
            >
              <Plus size={15} aria-hidden />
              {tab === 'notas' ? 'Nota' : 'Pendiente'}
            </Button>
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
          {notesByUnit.length === 0 && (
            <Card className="flex flex-col items-center gap-2 py-10 text-center">
              <NotebookPen size={22} className="text-content-subtle" aria-hidden />
              <p className="text-sm text-content-muted">Aún no hay notas en esta materia.</p>
            </Card>
          )}

          {notesByUnit.map(([unit, list]) => (
            <section key={unit} className="flex flex-col gap-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-content-subtle">{unit}</p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {list.map((n) => (
                  <Card key={n.id} className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-content">{n.title || 'Nota'}</h3>
                      {n.important && (
                        <Star
                          size={15}
                          className="shrink-0 fill-current text-warn"
                          aria-label="Importante"
                        />
                      )}
                    </div>
                    {n.body && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-content-muted">
                        {n.body}
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
      <NoteSheet
        open={addingNote}
        onClose={() => setAddingNote(false)}
        className={cls.name}
        onSave={(n) => addNote({ ...n, classCode })}
      />
    </div>
  )
}

interface NoteSheetProps {
  open: boolean
  onClose: () => void
  className: string
  onSave: (n: {
    date: string
    unit: string
    title: string
    notebookPage: string
    body: string
    important: boolean
  }) => void
}

function NoteSheet({ open, onClose, className, onSave }: NoteSheetProps) {
  const [unit, setUnit] = useState('')
  const [title, setTitle] = useState('')
  const [notebookPage, setNotebookPage] = useState('')
  const [body, setBody] = useState('')
  const [important, setImportant] = useState(false)

  function save() {
    if (!title.trim() && !body.trim()) return
    onSave({ date: todayIso(), unit, title, notebookPage, body, important })
    setUnit('')
    setTitle('')
    setNotebookPage('')
    setBody('')
    setImportant(false)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nueva nota"
      subtitle={className}
      footer={
        <Button variant="primary" size="lg" className="w-full justify-center" onClick={save}>
          Guardar nota
        </Button>
      }
    >
      <Field label="Tema o unidad" hint="Agrupa las notas por tema.">
        <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Derivadas" />
      </Field>
      <Field label="Título">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Regla de la cadena"
          autoFocus
        />
      </Field>
      <Field label="¿Qué vimos?">
        <TextArea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Lo importante de la clase…"
        />
      </Field>
      <Field label="Página del cuaderno">
        <TextInput
          value={notebookPage}
          onChange={(e) => setNotebookPage(e.target.value)}
          placeholder="42"
        />
      </Field>
      <button
        type="button"
        onClick={() => setImportant((v) => !v)}
        aria-pressed={important}
        className={cx(
          'flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm font-semibold transition-colors',
          important ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-content-muted',
        )}
      >
        <Star size={15} className={cx(important && 'fill-current')} aria-hidden />
        Marcar como importante
      </button>
    </Sheet>
  )
}
