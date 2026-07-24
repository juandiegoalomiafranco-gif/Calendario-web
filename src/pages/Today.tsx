import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PLAN, PRINCIPLES, GOAL_DATE, GOAL_DISTANCE_KM, todayISO, getDayPlan } from '../data/plan'
import { SessionCard } from '../components/SessionCard'
import { PrincipleCard } from '../components/PrincipleCard'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { holidayName } from '../data/holidays'
import { cycleInfoFor } from '../lib/cycle'
import { CLASSES, TIMETABLE } from '../data/schoolTimetable'
import { useSchoolConfig, useTasks } from '../hooks/useSchool'
import { URGENCY_META } from '../data/schoolTypes'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function weekdayOf(iso: string): string {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()]
}

function daysUntil(dateIso: string): number {
  const today = new Date(`${todayISO()}T00:00:00Z`)
  const target = new Date(`${dateIso}T00:00:00Z`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function Today() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { getEntry, toggleCompleted } = useTrainingLog()
  const { config } = useSchoolConfig()
  const { tasks } = useTasks()

  const principle = useMemo(() => {
    const idx = PLAN.findIndex((d) => d.date === iso)
    return PRINCIPLES[(idx >= 0 ? idx : 0) % PRINCIPLES.length]
  }, [iso])

  const cycle = useMemo(() => cycleInfoFor(iso, config), [iso, config])
  const classesToday = cycle.cycleDay ? TIMETABLE[cycle.cycleDay] ?? [] : []
  const remaining = daysUntil(GOAL_DATE)
  const holiday = holidayName(iso)

  const dueTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
        .slice(0, 3),
    [tasks],
  )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-ink-500 capitalize">{weekdayOf(iso)}</p>
          <h1 className="text-3xl font-bold text-ink-900 font-display">Hoy</h1>
        </div>
        {remaining >= 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600 leading-none">
              {remaining}
              <span className="text-sm font-semibold"> d</span>
            </p>
            <p className="text-[11px] text-ink-400">para el {GOAL_DISTANCE_KM}K</p>
          </div>
        )}
      </header>

      {holiday && (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-600 self-start">
          🇨🇴 Festivo · {holiday}
        </span>
      )}

      {/* Colegio de hoy */}
      <Link
        to="/colegio"
        className="rounded-3xl bg-card shadow-card p-4 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Colegio</h2>
          <span className="text-ink-400" aria-hidden>
            ›
          </span>
        </div>
        {cycle.schoolDay && cycle.cycleDay ? (
          <>
            <p className="text-xl font-bold text-ink-900 font-display mt-1">Día {cycle.cycleDay}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {classesToday
                .filter((s) => s.period !== 'Adv')
                .map((s) => {
                  const cls = CLASSES[s.classCode]
                  return (
                    <span
                      key={`${s.period}-${s.classCode}`}
                      className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${cls.color} ${cls.text}`}
                    >
                      {cls.name}
                    </span>
                  )
                })}
            </div>
          </>
        ) : (
          <p className="text-base font-semibold text-ink-700 mt-1">
            {holiday ? 'Festivo — sin clases' : 'Sin colegio hoy'}
          </p>
        )}
      </Link>

      {/* Entrenamiento de hoy */}
      <section className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Entrenamiento</h2>
        {day && day.sessions.length > 0 ? (
          day.sessions.map((s) => {
            const done = getEntry(s.id)?.completed
            return (
              <div key={s.id} className="flex flex-col gap-2">
                <SessionCard session={s} date={day.date} completed={done} />
                <button
                  onClick={() => toggleCompleted(s.id)}
                  className={`self-start rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    done ? 'bg-ok-100 text-ok-700' : 'bg-brand-500 text-white active:bg-brand-600'
                  }`}
                >
                  {done ? '✓ Hecho' : 'Completar'}
                </button>
              </div>
            )
          })
        ) : (
          <p className="text-ink-500 text-sm">Descanso — no hay entreno para hoy.</p>
        )}
        {day?.note && <p className="text-sm text-ink-500 bg-ink-100 rounded-2xl p-3">{day.note}</p>}
      </section>

      {/* Pendientes que vencen */}
      {dueTasks.length > 0 && (
        <Link
          to="/colegio"
          className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Pendientes</h2>
            <span className="text-ink-400" aria-hidden>
              ›
            </span>
          </div>
          {dueTasks.map((t) => {
            const cls = t.classCode ? CLASSES[t.classCode] : undefined
            const u = URGENCY_META[t.urgency]
            return (
              <div key={t.id} className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 truncate">{t.title}</p>
                  <p className="text-xs text-ink-500">
                    {cls ? cls.name : 'General'}
                    {t.dueDate ? ` · ${t.dueDate}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${u.color}`}>
                  {u.label}
                </span>
              </div>
            )
          })}
        </Link>
      )}

      {/* Principio del día */}
      <PrincipleCard text={principle} />
    </div>
  )
}
