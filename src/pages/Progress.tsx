import { useMemo } from 'react'
import { PLAN, GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../data/plan'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { chunkIntoWeeks } from '../lib/weeks'
import { computeStreaks, isRunning, kmForEntry, sessionCategory, type Category } from '../lib/stats'
import type { LogEntry } from '../data/types'

const CATEGORY_META: Record<Category, { emoji: string; label: string; colorClass: string }> = {
  running: { emoji: '🏃', label: 'Running', colorClass: 'bg-brand-500' },
  natacion: { emoji: '🏊', label: 'Natación', colorClass: 'bg-sky-500' },
  funcional: { emoji: '🏋️', label: 'Funcional', colorClass: 'bg-ink-700' },
  futbol: { emoji: '⚽', label: 'Fútbol', colorClass: 'bg-ok-500' },
  voley: { emoji: '🏐', label: 'Vóley', colorClass: 'bg-amber-400' },
  flex: { emoji: '🎲', label: 'Flex (sin detalle)', colorClass: 'bg-ink-400' },
  descanso: { emoji: '😴', label: 'Descanso', colorClass: 'bg-ink-300' },
}

const FEELING_META: { id: NonNullable<LogEntry['feeling']>; emoji: string; label: string; colorClass: string }[] = [
  { id: 'genial', emoji: '😄', label: 'Genial', colorClass: 'bg-ok-500' },
  { id: 'bien', emoji: '🙂', label: 'Bien', colorClass: 'bg-sky-500' },
  { id: 'regular', emoji: '😐', label: 'Regular', colorClass: 'bg-amber-400' },
  { id: 'cargado', emoji: '😖', label: 'Cargado', colorClass: 'bg-brand-600' },
]

function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

export function Progress() {
  const { log } = useTrainingLog()
  const iso = todayISO()

  const allSessions = useMemo(() => PLAN.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date }))), [])
  const pastOrTodaySessions = useMemo(() => allSessions.filter((s) => s.date <= iso), [allSessions, iso])

  const completedCount = pastOrTodaySessions.filter((s) => log[s.id]?.completed).length
  const totalPlanned = pastOrTodaySessions.length
  const completionPct = totalPlanned ? Math.round((completedCount / totalPlanned) * 100) : 0

  const workoutsDone = useMemo(
    () => allSessions.filter((s) => s.type !== 'rest' && log[s.id]?.completed).length,
    [allSessions, log],
  )

  const streaks = useMemo(() => computeStreaks(PLAN, log, iso), [log, iso])

  const km = useMemo(() => {
    let total = 0
    let registered = 0
    let estimated = 0
    let running = 0
    let longestRun = 0
    for (const s of allSessions) {
      const r = kmForEntry(s, log[s.id])
      total += r.km
      if (r.estimated) estimated += r.km
      else registered += r.km
      if (isRunning(s.type)) {
        running += r.km
        longestRun = Math.max(longestRun, r.km)
      }
    }
    return { total, registered, estimated, running, longestRun }
  }, [allSessions, log])

  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])

  const kmPerWeek = useMemo(
    () =>
      weeks.map((week, i) => {
        const value = week.reduce(
          (sum, day) => sum + day.sessions.reduce((s, sess) => s + kmForEntry(sess, log[sess.id]).km, 0),
          0,
        )
        return { label: `Sem ${i + 1}`, value, display: value ? value.toFixed(1) : '0' }
      }),
    [weeks, log],
  )

  const completionPerWeek = useMemo(
    () =>
      weeks.map((week, i) => {
        const past = week.filter((d) => d.date <= iso).flatMap((d) => d.sessions)
        const done = past.filter((s) => log[s.id]?.completed).length
        const pct = past.length ? Math.round((done / past.length) * 100) : 0
        return { label: `Sem ${i + 1}`, value: pct, display: `${pct}%` }
      }),
    [weeks, log, iso],
  )

  const byActivity = useMemo(() => {
    const counts = new Map<Category, number>()
    for (const s of allSessions) {
      const entry = log[s.id]
      if (!entry?.completed || s.type === 'rest') continue
      const cat = sessionCategory(s, entry)
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return (Object.keys(CATEGORY_META) as Category[])
      .filter((c) => c !== 'descanso' && (counts.get(c) ?? 0) > 0)
      .map((c) => ({ key: c, ...CATEGORY_META[c], count: counts.get(c) ?? 0 }))
  }, [allSessions, log])

  const feelings = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of allSessions) {
      const entry = log[s.id]
      if (entry?.completed && entry.feeling) counts.set(entry.feeling, (counts.get(entry.feeling) ?? 0) + 1)
    }
    const rows = FEELING_META.map((f) => ({ key: f.id, emoji: f.emoji, label: f.label, colorClass: f.colorClass, count: counts.get(f.id) ?? 0 }))
    return { rows, total: rows.reduce((a, r) => a + r.count, 0) }
  }, [allSessions, log])

  const completedRuns = useMemo(
    () =>
      allSessions
        .filter((s) => isRunning(s.type) && log[s.id]?.completed)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [allSessions, log],
  )

  const hrTrend = useMemo(
    () =>
      completedRuns
        .filter((s) => log[s.id]?.avgHr != null)
        .map((s) => ({ label: shortDate(s.date), value: log[s.id]!.avgHr! })),
    [completedRuns, log],
  )

  const runDistanceTrend = useMemo(
    () =>
      completedRuns
        .map((s) => ({ label: shortDate(s.date), value: kmForEntry(s, log[s.id]).km }))
        .filter((p) => p.value > 0),
    [completedRuns, log],
  )

  const daysRemaining = Math.max(
    0,
    Math.round((new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000),
  )

  const longestRunPct = Math.min(100, (km.longestRun / GOAL_DISTANCE_KM) * 100)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Progreso</h1>
      </header>

      <div className="rounded-4xl bg-card shadow-card p-5 flex items-center gap-5">
        <ProgressRing value={completionPct} size={104} strokeWidth={12}>
          <div className="text-center">
            <p className="text-2xl font-bold text-ink-900">{completionPct}%</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-sm text-ink-500">Sesiones completadas</p>
          <p className="text-xl font-bold text-ink-900">
            {completedCount} / {totalPlanned}
          </p>
          <p className="text-sm text-ink-500 mt-2">Faltan {daysRemaining} días para el intento de {GOAL_DISTANCE_KM} km</p>
        </div>
      </div>

      <div className="flex gap-3">
        <StatCard label="Entrenos" value={String(workoutsDone)} icon="💪" caption="sesiones completadas" />
        <StatCard
          label="Racha"
          value={String(streaks.current)}
          unit={streaks.current === 1 ? 'día' : 'días'}
          icon="🔥"
          caption={`mejor: ${streaks.best} ${streaks.best === 1 ? 'día' : 'días'}`}
        />
      </div>

      <div className="flex gap-3">
        <StatCard
          label="Km acumulados"
          value={km.total.toFixed(1)}
          unit="km"
          icon="📍"
          caption={
            km.estimated > 0
              ? `${km.registered.toFixed(1)} km registrados · ${km.estimated.toFixed(1)} km estimados del plan`
              : 'todo registrado por ti'
          }
        />
        <StatCard label="Km corriendo" value={km.running.toFixed(1)} unit="km" icon="🏃" caption={`meta: ${GOAL_DISTANCE_KM} km seguidos`} />
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-ink-900">🎯 Tu fondo más largo</p>
          <p className="text-sm font-bold text-ink-900">
            {km.longestRun.toFixed(1)} <span className="text-ink-400 font-medium">/ {GOAL_DISTANCE_KM} km</span>
          </p>
        </div>
        <div className="h-3 rounded-full bg-ink-100 overflow-hidden">
          <div className="h-full rounded-full bg-ok-500" style={{ width: `${longestRunPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Km por semana</h2>
        <WeeklyBars bars={kmPerWeek} />
      </section>

      {byActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Por actividad</h2>
          <BreakdownBars rows={byActivity} />
        </section>
      )}

      {feelings.total > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Sensaciones</h2>
          <BreakdownBars rows={feelings.rows} />
        </section>
      )}

      {runDistanceTrend.length >= 2 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Distancia por carrera</h2>
          <TrendLine points={runDistanceTrend} unit="km por carrera" />
        </section>
      )}

      {hrTrend.length >= 2 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">FC media en carrera</h2>
          <TrendLine points={hrTrend} unit="pulsaciones por minuto" color="#0ea5e9" decimals={0} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Cumplimiento por semana</h2>
        <WeeklyBars bars={completionPerWeek} max={100} />
      </section>
    </div>
  )
}
