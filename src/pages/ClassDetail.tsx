import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CLASSES } from '../data/schoolTimetable'
import { todayISO } from '../data/plan'
import { useClassNotes, useTasks } from '../hooks/useSchool'
import { URGENCY_META, type Urgency } from '../data/schoolTypes'

type Tab = 'notas' | 'tareas'

export function ClassDetail() {
  const { code } = useParams()
  const classCode = code ? decodeURIComponent(code) : ''
  const cls = CLASSES[classCode]

  const { notes, addNote, removeNote } = useClassNotes(classCode)
  const { tasks, addTask, toggleTask, removeTask } = useTasks(classCode)
  const [tab, setTab] = useState<Tab>('notas')

  const notesByUnit = useMemo(() => {
    const groups = new Map<string, typeof notes>()
    for (const n of [...notes].sort((a, b) => b.date.localeCompare(a.date))) {
      const key = n.unit.trim() || 'Sin unidad'
      groups.set(key, [...(groups.get(key) ?? []), n])
    }
    return Array.from(groups.entries())
  }, [notes])

  if (!cls) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-500">No encontramos esa clase.</p>
        <Link to="/colegio" className="self-start text-brand-600 font-semibold">
          ← Volver a Colegio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link
          to="/colegio"
          className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
        >
          <span aria-hidden>←</span> Colegio
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <div className={`w-11 h-11 rounded-2xl ${cls.color} ${cls.text} flex items-center justify-center text-lg font-bold`}>
            {cls.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900 font-display leading-tight">{cls.name}</h1>
            <p className="text-sm text-ink-500">Profe {cls.teacher}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-card rounded-full shadow-card p-1.5">
        {(['notas', 'tareas'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-brand-500 text-white' : 'text-ink-500'
            }`}
          >
            {t} {t === 'notas' ? `(${notes.length})` : `(${tasks.filter((x) => !x.done).length})`}
          </button>
        ))}
      </div>

      {tab === 'notas' ? (
        <>
          <NoteForm onAdd={(n) => addNote({ ...n, classCode })} />
          <div className="flex flex-col gap-4">
            {notesByUnit.length === 0 && <p className="text-sm text-ink-500">Aún no hay notas en esta clase.</p>}
            {notesByUnit.map(([unit, list]) => (
              <section key={unit}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">{unit}</p>
                <div className="flex flex-col gap-2">
                  {list.map((n) => (
                    <div key={n.id} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-ink-900">{n.title || 'Nota'}</h3>
                        {n.important && (
                          <span className="shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-brand-600 text-white">
                            Importante
                          </span>
                        )}
                      </div>
                      {n.body && <p className="text-sm text-ink-600">{n.body}</p>}
                      <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5">
                        <span>{n.date}</span>
                        {n.notebookPage && <span>📓 Cuaderno pág. {n.notebookPage}</span>}
                        <button onClick={() => removeNote(n.id)} className="ml-auto text-ink-400 active:text-brand-500">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <TaskForm onAdd={(t) => addTask({ ...t, classCode })} />
          <div className="flex flex-col gap-2">
            {tasks.length === 0 && <p className="text-sm text-ink-500">Aún no hay tareas en esta clase.</p>}
            {[...tasks]
              .sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
              .map((t) => {
                const u = URGENCY_META[t.urgency]
                return (
                  <div key={t.id} className="rounded-3xl bg-card shadow-card p-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                      className="mt-0.5 w-5 h-5 rounded accent-ok-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${t.done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
                        {t.title}
                      </p>
                      {t.detail && <p className="text-xs text-ink-500 mt-0.5">{t.detail}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${u.color}`}>{u.label}</span>
                        {t.dueDate && <span className="text-xs text-ink-400">📅 {t.dueDate}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeTask(t.id)} className="text-ink-400 active:text-brand-500 text-xs">
                      ✕
                    </button>
                  </div>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}

function NoteForm({ onAdd }: { onAdd: (n: { date: string; unit: string; title: string; notebookPage: string; body: string; important: boolean }) => void }) {
  const [open, setOpen] = useState(false)
  const [unit, setUnit] = useState('')
  const [title, setTitle] = useState('')
  const [notebookPage, setNotebookPage] = useState('')
  const [body, setBody] = useState('')
  const [important, setImportant] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-card shadow-card p-3 text-sm font-semibold text-brand-500 active:bg-ink-100"
      >
        + Añadir nota
      </button>
    )
  }

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2.5">
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Tema / unidad (ej. Derivadas)"
        className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la nota"
        className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="¿Qué vimos? ¿Qué es importante?"
        className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
      />
      <input
        value={notebookPage}
        onChange={(e) => setNotebookPage(e.target.value)}
        placeholder="Página del cuaderno (ej. 42)"
        className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
      />
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} className="w-5 h-5 rounded accent-brand-500" />
        Marcar como importante
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!title.trim() && !body.trim()) return
            onAdd({ date: todayISO(), unit, title, notebookPage, body, important })
            setUnit('')
            setTitle('')
            setNotebookPage('')
            setBody('')
            setImportant(false)
            setOpen(false)
          }}
          className="flex-1 rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold active:bg-brand-600"
        >
          Guardar nota
        </button>
        <button onClick={() => setOpen(false)} className="rounded-xl bg-ink-100 text-ink-600 px-4 text-sm font-medium">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function TaskForm({ onAdd }: { onAdd: (t: { title: string; detail?: string; dueDate?: string; urgency: Urgency }) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('normal')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-card shadow-card p-3 text-sm font-semibold text-brand-500 active:bg-ink-100"
      >
        + Añadir tarea
      </button>
    )
  }

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej. Terminar el taller"
        className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
      />
      <label className="flex flex-col gap-1 text-xs text-ink-500">
        Fecha de entrega
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
        />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(URGENCY_META) as Urgency[]).map((u) => (
          <button
            key={u}
            onClick={() => setUrgency(u)}
            className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
              urgency === u ? URGENCY_META[u].color : 'bg-ink-100 text-ink-600'
            }`}
          >
            {URGENCY_META[u].label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!title.trim()) return
            onAdd({ title, dueDate: dueDate || undefined, urgency })
            setTitle('')
            setDueDate('')
            setUrgency('normal')
            setOpen(false)
          }}
          className="flex-1 rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold active:bg-brand-600"
        >
          Guardar tarea
        </button>
        <button onClick={() => setOpen(false)} className="rounded-xl bg-ink-100 text-ink-600 px-4 text-sm font-medium">
          Cancelar
        </button>
      </div>
    </div>
  )
}
