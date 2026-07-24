import { useMemo, useState } from 'react'
import { getDayPlan, todayISO } from '../data/plan'
import { cycleInfoFor } from '../lib/cycle'
import { TIMETABLE } from '../data/schoolTimetable'
import { useSchoolConfig, useTasks } from '../hooks/useSchool'
import { URGENCY_META } from '../data/schoolTypes'
import { EVENT_TYPE_META, useCalendarEvents, type EventType } from '../hooks/useCalendarEvents'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WD = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const pad = (n: number) => String(n).padStart(2, '0')

type AddKind = 'importante' | 'evento' | 'tarea'

export function Calendario() {
  const today = todayISO()
  const [year, setYear] = useState(Number(today.slice(0, 4)))
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1)
  const [selected, setSelected] = useState(today)
  const { tasks, addTask } = useTasks()
  const { events, addEvent, removeEvent } = useCalendarEvents()
  const { config } = useSchoolConfig()

  const [showAdd, setShowAdd] = useState(false)
  const [addKind, setAddKind] = useState<AddKind>('importante')
  const [addTitle, setAddTitle] = useState('')

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1))
    const startWd = first.getUTCDay()
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const arr: (string | null)[] = []
    for (let i = 0; i < startWd; i++) arr.push(null)
    for (let d = 1; d <= days; d++) arr.push(`${year}-${pad(month + 1)}-${pad(d)}`)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [year, month])

  const tasksDue = useMemo(() => {
    const m = new Set<string>()
    for (const t of tasks) if (t.dueDate && !t.done) m.add(t.dueDate)
    return m
  }, [tasks])
  const importantDates = useMemo(() => new Set(events.filter((e) => e.type === 'importante').map((e) => e.date)), [events])
  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events])

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const cycle = cycleInfoFor(selected, config)
  const dayPlan = getDayPlan(selected)
  const trainingToday = (dayPlan?.sessions ?? []).filter((s) => s.type !== 'rest')
  const dayEvents = events.filter((e) => e.date === selected)
  const dayTasks = tasks.filter((t) => t.dueDate === selected)

  function saveAdd() {
    const title = addTitle.trim()
    if (!title) return
    if (addKind === 'tarea') addTask({ title, dueDate: selected, urgency: 'normal' })
    else addEvent({ date: selected, title, type: (addKind === 'importante' ? 'importante' : 'otro') as EventType })
    setAddTitle('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-900 font-display">Calendario</h1>
      </header>

      {/* Mes */}
      <div className="rounded-4xl bg-card shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 active:bg-ink-200">‹</button>
          <p className="text-base font-semibold text-ink-900 font-display">{MONTHS[month]} {year}</p>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 active:bg-ink-200">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WD.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold text-ink-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />
            const dayNum = Number(iso.slice(8, 10))
            const isToday = iso === today
            const isSelected = iso === selected
            const isImportant = importantDates.has(iso)
            const hasDot = tasksDue.has(iso) || eventDates.has(iso)
            return (
              <button
                key={i}
                onClick={() => setSelected(iso)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative ${
                  isSelected ? 'bg-brand-500 text-white font-bold' : isImportant ? 'bg-brand-50 text-brand-700 font-semibold' : isToday ? 'bg-ink-100 text-ink-900 font-semibold' : 'text-ink-700'
                }`}
              >
                {dayNum}
                {hasDot && !isSelected && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isImportant ? 'bg-brand-600' : 'bg-ink-400'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agenda del día */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">{selected === today ? 'Hoy' : selected}</h2>
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-1.5 active:bg-brand-600">
          {showAdd ? 'Cerrar' : '+'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {(['importante', 'evento', 'tarea'] as AddKind[]).map((k) => (
              <button key={k} onClick={() => setAddKind(k)} className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold capitalize ${addKind === k ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-500'}`}>
                {k === 'importante' ? '⭐ Importante' : k === 'evento' ? '📌 Evento' : '✅ Tarea'}
              </button>
            ))}
          </div>
          <input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder={`Añadir a ${selected}…`} className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900" />
          <button onClick={saveAdd} className="rounded-full bg-brand-500 text-white font-semibold py-2 active:bg-brand-600">Guardar</button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {cycle.schoolDay && cycle.cycleDay && (
          <AgendaRow color="bg-sky-500" label={`Colegio — Día ${cycle.cycleDay}`} detail={`${TIMETABLE[cycle.cycleDay].length} clases`} />
        )}
        {trainingToday.map((s) => (
          <AgendaRow key={s.id} color="bg-ok-500" label="Entreno" detail={s.title} />
        ))}
        {dayEvents.map((e) => (
          <AgendaRow key={e.id} color={EVENT_TYPE_META[e.type].dot} label={EVENT_TYPE_META[e.type].label} detail={e.title} onRemove={() => removeEvent(e.id)} />
        ))}
        {dayTasks.map((t) => (
          <AgendaRow key={t.id} color={URGENCY_META[t.urgency].dot} label={URGENCY_META[t.urgency].label} detail={`${t.title}${t.done ? ' ✓' : ''}`} />
        ))}
        {!cycle.schoolDay && trainingToday.length === 0 && dayEvents.length === 0 && dayTasks.length === 0 && (
          <p className="text-sm text-ink-500">Nada agendado este día.</p>
        )}
      </div>
    </div>
  )
}

function AgendaRow({ color, label, detail, onRemove }: { color: string; label: string; detail: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card shadow-card p-3">
      <span className={`shrink-0 w-1.5 self-stretch rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900 truncate">{detail}</p>
      </div>
      {onRemove && <button onClick={onRemove} className="text-xs text-ink-300 active:text-brand-600">✕</button>}
    </div>
  )
}
