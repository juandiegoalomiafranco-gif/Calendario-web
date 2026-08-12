import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { todayISO } from '../data/plan'
import { NOTE_CATEGORY_META, useTrainingNotes, type NoteCategory } from '../hooks/useTrainingNotes'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, TextArea, TextInput } from '../components/ui/Field'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { formatDayMonth } from '../lib/dates'
import { cx } from '../lib/cx'

const CATEGORIES: NoteCategory[] = ['importante', 'lesion', 'general']
type Filter = NoteCategory | 'todas'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  ...CATEGORIES.map((c) => ({ value: c as Filter, label: NOTE_CATEGORY_META[c].label })),
]

export function GymNotes() {
  const { notes, addNote, removeNote } = useTrainingNotes()
  const [filter, setFilter] = useState<Filter>('todas')
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<NoteCategory>('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const shown = filter === 'todas' ? notes : notes.filter((n) => n.category === filter)

  function save() {
    if (!title.trim() && !body.trim()) return
    addNote({ category, title: title.trim(), body: body.trim(), date: todayISO() })
    setTitle('')
    setBody('')
    setCategory('general')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Entreno"
        title="Notas de gym"
        description="Molestias, lesiones y cosas para tener en cuenta."
        actions={
          <>
            <SegmentedControl
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filtrar notas"
              variant="pill"
            />
            <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? (
                <>
                  <X size={16} aria-hidden />
                  Cerrar
                </>
              ) : (
                <>
                  <Plus size={16} aria-hidden />
                  Nota
                </>
              )}
            </Button>
          </>
        }
      />

      {showForm && (
        <Card padding="lg">
          <CardHeader title="Nueva nota" />
          <div className="flex flex-col gap-3">
            <Field label="Categoría">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const meta = NOTE_CATEGORY_META[c]
                  const active = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={active}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors',
                        active ? meta.color.solid : 'bg-surface-2 text-content-muted hover:text-content',
                      )}
                    >
                      <meta.Icon size={14} aria-hidden />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Field label="Título">
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Molestia rodilla derecha…"
                />
              </Field>
              <Field label="Detalle">
                <TextArea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="Qué pasó, desde cuándo, qué lo alivia…"
                />
              </Field>
            </div>

            <Button variant="primary" size="lg" onClick={save} className="self-start">
              Guardar nota
            </Button>
          </div>
        </Card>
      )}

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
          {shown.map((n) => {
            const meta = NOTE_CATEGORY_META[n.category]
            return (
              <Card key={n.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      meta.color.soft,
                    )}
                  >
                    <meta.Icon size={12} aria-hidden />
                    {meta.label}
                  </span>
                  <span className="text-xs text-content-subtle">{formatDayMonth(n.date)}</span>
                  <button
                    type="button"
                    onClick={() => removeNote(n.id)}
                    aria-label="Borrar nota"
                    className="ml-auto text-content-subtle transition-colors hover:text-danger"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
                {n.title && <p className="text-[15px] font-bold text-content">{n.title}</p>}
                {n.body && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-content-muted">
                    {n.body}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-content-muted">
            {filter === 'todas' ? 'Sin notas todavía.' : 'Ninguna nota en esta categoría.'}
          </p>
        </Card>
      )}
    </div>
  )
}
