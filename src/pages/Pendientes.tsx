import { useMemo, useState } from 'react'
import { CLASSES } from '../data/schoolTimetable'
import { URGENCY_META, type Urgency } from '../data/schoolTypes'
import { useTasks } from '../hooks/useSchool'

const URGENCIES: Urgency[] = ['urgente', 'normal', 'puede_esperar']
const CLASS_LIST = Object.values(CLASSES)

export function Pendientes() {
  const { tasks, addTask, toggleTask, removeTask } = useTasks()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [classCode, setClassCode] = useState('')
  const [filterUrgency, setFilterUrgency] = useState<Urgency | 'todas'>('todas')
  const [showDone, setShowDone] = useState(false)

  const shown = useMemo(() => {
    return tasks
      .filter((t) => (showDone ? true : !t.done))
      .filter((t) => (filterUrgency === 'todas' ? true : t.urgency === filterUrgency))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
      })
  }, [tasks, showDone, filterUrgency])

  function save() {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      detail: detail.trim() || undefined,
      dueDate: dueDate || undefined,
      urgency,
      classCode: classCode || undefined,
    })
    setTitle('')
    setDetail('')
    setDueDate('')
    setUrgency('normal')
    setClassCode('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-ink-900 font-display">Pendientes</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-2 active:bg-brand-600">
          {showForm ? 'Cerrar' : '+ Tarea'}
        </button>
      </header>

      {showForm && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué hay que hacer?" className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900" />
          <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} placeholder="Detalle (opcional)" className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900" />
          <div className="flex gap-2">
            <label className="flex-1 flex flex-col gap-1 text-xs text-ink-500">
              Fecha
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900" />
            </label>
            <label className="flex-1 flex flex-col gap-1 text-xs text-ink-500">
              Clase (opcional)
              <select value={classCode} onChange={(e) => setClassCode(e.target.value)} className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900">
                <option value="">—</option>
                {CLASS_LIST.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            {URGENCIES.map((u) => (
              <button key={u} onClick={() => setUrgency(u)} className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold ${urgency === u ? URGENCY_META[u].color : 'bg-ink-100 text-ink-500'}`}>
                {URGENCY_META[u].label}
              </button>
            ))}
          </div>
          <button onClick={save} className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600">Guardar</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {(['todas', ...URGENCIES] as const).map((u) => (
          <button key={u} onClick={() => setFilterUrgency(u)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filterUrgency === u ? 'bg-ink-900 text-white' : 'bg-card text-ink-500 shadow-card'}`}>
            {u === 'todas' ? 'Todas' : URGENCY_META[u].label}
          </button>
        ))}
        <button onClick={() => setShowDone((v) => !v)} className={`ml-auto rounded-full px-3 py-1.5 text-xs font-semibold ${showDone ? 'bg-ok-500 text-white' : 'bg-card text-ink-500 shadow-card'}`}>
          {showDone ? 'Ocultar hechas' : 'Ver hechas'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {shown.map((t) => {
          const cls = t.classCode ? CLASSES[t.classCode] : undefined
          const u = URGENCY_META[t.urgency]
          return (
            <div key={t.id} className={`rounded-2xl bg-card shadow-card p-3 flex items-start gap-3 ${t.done ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleTask(t.id)} className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${t.done ? 'bg-ok-500 border-ok-500 text-white' : 'border-ink-300'}`}>
                {t.done && '✓'}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium text-ink-900 ${t.done ? 'line-through' : ''}`}>{t.title}</p>
                {t.detail && <p className="text-xs text-ink-500">{t.detail}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${u.color}`}>{u.label}</span>
                  {cls && <span className="text-[11px] text-ink-500">{cls.name}</span>}
                  {t.dueDate && <span className="text-[11px] text-ink-400">· {t.dueDate}</span>}
                </div>
              </div>
              <button onClick={() => removeTask(t.id)} className="text-xs text-ink-300 active:text-brand-600">✕</button>
            </div>
          )
        })}
        {shown.length === 0 && <p className="text-sm text-ink-500">Nada por aquí. 🎉</p>}
      </div>
    </div>
  )
}
