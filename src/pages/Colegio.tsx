import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { todayISO } from '../data/plan'
import { holidayName } from '../data/holidays'
import { CLASSES, PERIODS, TIMETABLE } from '../data/schoolTimetable'
import { cycleInfoFor } from '../lib/cycle'
import { useSchoolConfig, useTasks } from '../hooks/useSchool'
import { URGENCY_META } from '../data/schoolTypes'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function weekdayOf(dateISO: string): string {
  return WEEKDAYS[new Date(`${dateISO}T00:00:00Z`).getUTCDay()]
}

export function Colegio() {
  const iso = todayISO()
  const { config, setCycleDayOn } = useSchoolConfig()
  const { tasks } = useTasks()

  const today = useMemo(() => cycleInfoFor(iso, config), [iso, config])
  const [selectedDay, setSelectedDay] = useState<number>(today.cycleDay ?? 1)
  const [editingDay, setEditingDay] = useState(false)

  const slots = TIMETABLE[selectedDay] ?? []
  const holiday = holidayName(iso)

  const pendingTasks = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-ink-500 capitalize">{weekdayOf(iso)}</p>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Colegio</h1>
      </header>

      {/* Tarjeta de HOY */}
      <div className="rounded-4xl bg-gradient-to-br from-brand-500 to-brand-700 text-white p-5 shadow-card">
        {today.schoolDay ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Hoy es</p>
            <p className="text-4xl font-bold font-display leading-tight">Día {today.cycleDay}</p>
            <p className="text-sm text-white/80 mt-1">
              {slots.length > 0 && selectedDay === today.cycleDay
                ? `${TIMETABLE[today.cycleDay!].length} clases`
                : 'Ciclo de 6 días'}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Hoy</p>
            <p className="text-2xl font-bold font-display leading-tight">
              {holiday ? `Festivo · ${holiday}` : 'Sin colegio'}
            </p>
            <p className="text-sm text-white/80 mt-1">El ciclo no avanza hoy.</p>
          </>
        )}

        <button
          onClick={() => setEditingDay((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium active:bg-white/25"
        >
          {editingDay ? 'Cerrar' : '¿No es el día correcto? Ajustar'}
        </button>

        {editingDay && (
          <div className="mt-3 bg-white/10 rounded-2xl p-3">
            <p className="text-xs text-white/90 mb-2">Hoy en realidad es el…</p>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setCycleDayOn(iso, d)
                    setSelectedDay(d)
                    setEditingDay(false)
                  }}
                  className="min-h-[40px] rounded-xl bg-white/20 text-sm font-semibold active:bg-white/40"
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/70 mt-2">Reinicia el ciclo desde hoy.</p>
          </div>
        )}
      </div>

      {/* Selector de día de ciclo */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((d) => {
          const active = d === selectedDay
          const isToday = d === today.cycleDay
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-1 min-w-0 rounded-2xl py-2.5 text-sm font-semibold transition-colors ${
                active ? 'bg-brand-500 text-white' : 'bg-card text-ink-600 shadow-card'
              }`}
            >
              <span className="block text-[10px] uppercase opacity-70">Día</span>
              {d}
              {isToday && <span className={`block mx-auto mt-0.5 w-1 h-1 rounded-full ${active ? 'bg-white' : 'bg-brand-500'}`} />}
            </button>
          )
        })}
      </div>

      {/* Horario del día seleccionado */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Horario — Día {selectedDay}</h2>
        {slots.map((s) => {
          const cls = CLASSES[s.classCode]
          const period = PERIODS.find((p) => p.period === s.period)
          return (
            <Link
              key={`${s.period}-${s.classCode}`}
              to={`/colegio/clase/${encodeURIComponent(s.classCode)}`}
              className="flex items-center gap-3 rounded-3xl bg-card shadow-card p-3 active:scale-[0.98] transition-transform"
            >
              <div className="shrink-0 w-14 text-center">
                <p className="text-[10px] font-semibold text-ink-400 uppercase">{s.period}</p>
                <p className="text-[11px] text-ink-500 leading-tight">{period?.start}</p>
              </div>
              <div className={`shrink-0 w-1.5 self-stretch rounded-full ${cls.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-ink-900 truncate">{cls.name}</p>
                <p className="text-xs text-ink-500">
                  {cls.teacher}
                  {s.room ? ` · ${s.room}` : ''}
                </p>
              </div>
              <span className="text-ink-400" aria-hidden>
                ›
              </span>
            </Link>
          )
        })}
      </section>

      {/* Pendientes próximos */}
      {pendingTasks.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-ink-900">Próximas tareas</h2>
          {pendingTasks.map((t) => {
            const cls = t.classCode ? CLASSES[t.classCode] : undefined
            const u = URGENCY_META[t.urgency]
            return (
              <div key={t.id} className="flex items-center gap-2.5 rounded-2xl bg-card shadow-card p-3">
                <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 truncate">{t.title}</p>
                  <p className="text-xs text-ink-500">
                    {cls ? cls.name : 'General'}
                    {t.dueDate ? ` · ${t.dueDate}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${u.color}`}>{u.label}</span>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
