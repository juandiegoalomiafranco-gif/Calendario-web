import { useState } from 'react'
import { todayISO } from '../data/plan'
import { NOTE_CATEGORY_META, useTrainingNotes, type NoteCategory } from '../hooks/useTrainingNotes'

const CATEGORIES: NoteCategory[] = ['importante', 'lesion', 'general']

export function GymNotes() {
  const { notes, addNote, removeNote } = useTrainingNotes()
  const [filter, setFilter] = useState<NoteCategory | 'todas'>('todas')
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
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 font-display">Notas de gym</h1>
          <p className="text-sm text-ink-500 mt-1">Molestias, lesiones y cosas para tener en cuenta.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-2 active:bg-brand-600">
          {showForm ? 'Cerrar' : '+ Nota'}
        </button>
      </header>

      {showForm && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold ${
                  category === c ? NOTE_CATEGORY_META[c].color : 'bg-ink-100 text-ink-500'
                }`}
              >
                {NOTE_CATEGORY_META[c].emoji} {NOTE_CATEGORY_META[c].label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (p. ej. molestia rodilla derecha)"
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Detalle…"
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          />
          <button onClick={save} className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600">
            Guardar nota
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(['todas', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === c ? 'bg-ink-900 text-white' : 'bg-card text-ink-500 shadow-card'
            }`}
          >
            {c === 'todas' ? 'Todas' : NOTE_CATEGORY_META[c].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {shown.map((n) => {
          const meta = NOTE_CATEGORY_META[n.category]
          return (
            <div key={n.id} className="rounded-2xl bg-card shadow-card p-3.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${meta.color}`}>
                  {meta.emoji} {meta.label}
                </span>
                <span className="text-xs text-ink-400">{n.date}</span>
                <button onClick={() => removeNote(n.id)} className="ml-auto text-xs text-ink-300 active:text-brand-600">
                  ✕
                </button>
              </div>
              {n.title && <p className="text-sm font-semibold text-ink-900">{n.title}</p>}
              {n.body && <p className="text-sm text-ink-600 whitespace-pre-wrap">{n.body}</p>}
            </div>
          )
        })}
        {shown.length === 0 && <p className="text-sm text-ink-500">Sin notas todavía.</p>}
      </div>
    </div>
  )
}
