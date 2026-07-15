import { useMemo } from 'react'
import { GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../../data/plan'
import { StatCard } from '../StatCard'
import { ProgressRing } from '../ProgressRing'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { computePlanStats } from './planStats'

export function PlanTab() {
  const { log } = useTrainingLog()
  const iso = todayISO()

  const stats = useMemo(() => computePlanStats(log), [log])

  const daysRemaining = Math.max(
    0,
    Math.round((new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000),
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-4xl bg-card shadow-card p-5 flex items-center gap-5">
        <ProgressRing value={stats.completionPct} size={104} strokeWidth={12} trackColor="#24262b" progressColor="#f43f5e">
          <div className="text-center">
            <p className="text-2xl font-bold text-ink-900">{stats.completionPct}%</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-sm text-ink-500">Sesiones completadas</p>
          <p className="text-xl font-bold text-ink-900">
            {stats.completedCount} / {stats.totalPlanned}
          </p>
          <p className="text-sm text-ink-500 mt-2">
            Faltan {daysRemaining} días para el intento de {GOAL_DISTANCE_KM} km
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <StatCard label="Racha" value={String(stats.streak)} unit={stats.streak === 1 ? 'día' : 'días'} icon="🔥" />
        <StatCard label="Km acumulados" value={stats.kmDone.toFixed(1)} unit="km" icon="📍" />
        <StatCard label="Meta" value={String(GOAL_DISTANCE_KM)} unit="km" icon="🎯" />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Cumplimiento por semana</h2>
        <div className="rounded-3xl bg-card shadow-card p-4 flex items-end gap-3 h-40">
          {stats.weeks.map((w, i) => {
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
