import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PLAN, getDayPlan, todayISO, GOAL_DISTANCE_KM } from '../data/plan'
import { SessionCard } from '../components/SessionCard'
import { StatCard } from '../components/StatCard'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { computeStreaks, kmForEntry } from '../lib/stats'

const LINKS = [
  { to: '/semana', emoji: '🗓️', label: 'Plan de la semana', caption: 'Ver el calendario completo' },
  { to: '/progreso', emoji: '📈', label: 'Estadísticas', caption: 'Km, ritmo, FC y cumplimiento' },
  { to: '/entreno/fuerza', emoji: '🏋️', label: 'Levantamientos', caption: 'Series, reps, peso y PR' },
  { to: '/entreno/notas', emoji: '📝', label: 'Notas de gym', caption: 'Molestias, lesiones, recordatorios' },
]

export function Entreno() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { log, getEntry, toggleCompleted } = useTrainingLog()

  const streaks = useMemo(() => computeStreaks(PLAN, log, iso), [log, iso])
  const kmTotal = useMemo(() => {
    let total = 0
    for (const d of PLAN) for (const s of d.sessions) total += kmForEntry(s, log[s.id]).km
    return total
  }, [log])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Entreno</h1>
        <p className="text-sm text-ink-500 mt-1">Camino al {GOAL_DISTANCE_KM}K del 5 de agosto.</p>
      </header>

      <div className="flex gap-3">
        <StatCard label="Racha" value={String(streaks.current)} unit={streaks.current === 1 ? 'día' : 'días'} icon="🔥" caption={`mejor: ${streaks.best}`} />
        <StatCard label="Km acumulados" value={kmTotal.toFixed(1)} unit="km" icon="📍" caption="registrados + plan" />
      </div>

      <section className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Hoy</h2>
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
      </section>

      <div className="flex flex-col gap-2.5">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-3xl bg-card shadow-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
            <span className="text-2xl" aria-hidden>{l.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-ink-900">{l.label}</p>
              <p className="text-xs text-ink-500">{l.caption}</p>
            </div>
            <span className="text-ink-400" aria-hidden>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
