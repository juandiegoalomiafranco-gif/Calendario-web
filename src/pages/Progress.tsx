import { useMemo } from 'react'
import { PLAN, GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../data/plan'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { useTrainingLog } from '../hooks/useTrainingLog'

function parseDistance(value?: string): number {
  if (!value) return 0
  const nums = value.match(/\d+(\.\d+)?/g)
  if (!nums || nums.length === 0) return 0
  const parsed = nums.map(Number)
  return parsed.reduce((a, b) => a + b, 0) / parsed.length
}

export function Progress() {
  const { log } = useTrainingLog()
  const iso = todayISO()

  const allSessions = useMemo(() => PLAN.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date }))), [])
  const pastOrTodaySessions = useMemo(() => allSessions.filter((s) => s.date <= iso), [allSessions, iso])

  const completedCount = pastOrTodaySessions.filter((s) => log[s.id]?.completed).length
  const totalPlanned = pastOrTodaySessions.length
  const completionPct = totalPlanned ? Math.round((completedCount / totalPlanned) * 100) : 0

  const kmDone = useMemo(() => {
    return allSessions.reduce((sum, s) => {
      const entry = log[s.id]
      if (!entry?.completed) return sum
      const km = entry.distanceKm ?? parseDistance(s.distanceKm)
      return sum + km
    }, 0)
  }, [allSessions, log])

  const weeks = useMemo(() => {
    const map = new Map<string, { label: string; completed: number; total: number }>()
    for (const s of pastOrTodaySessions) {
      const weekLabel = s.date.slice(0, 7) + '-' + String(Math.ceil(Number(s.date.slice(8, 10)) / 7))
      const bucket = map.get(weekLabel) ?? { label: weekLabel, completed: 0, total: 0 }
      bucket.total += 1
      if (log[s.id]?.completed) bucket.completed += 1
      map.set(weekLabel, bucket)
    }
    return Array.from(map.values())
  }, [pastOrTodaySessions, log])

  const daysRemaining = Math.max(
    0,
    Math.round((new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000),
  )

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Progreso</h1>
      </header>

      <div className="rounded-4xl bg-white shadow-card p-5 flex items-center gap-5">
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
        <StatCard label="Km acumulados" value={kmDone.toFixed(1)} unit="km" icon="📍" />
        <StatCard label="Meta" value={String(GOAL_DISTANCE_KM)} unit="km" icon="🎯" />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Cumplimiento por semana</h2>
        <div className="rounded-3xl bg-white shadow-card p-4 flex items-end gap-3 h-40">
          {weeks.map((w, i) => {
            const pct = w.total ? (w.completed / w.total) * 100 : 0
            return (
              <div key={w.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                <div className="w-full rounded-t-xl bg-ink-100 flex-1 flex flex-col justify-end overflow-hidden">
                  <div
                    className="w-full bg-brand-500 rounded-t-xl"
                    style={{ height: `${pct}%`, transition: 'height 0.3s ease' }}
                  />
                </div>
                <span className="text-[11px] text-ink-400">Sem {i + 1}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
