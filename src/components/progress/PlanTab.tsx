import { useMemo } from 'react'
import { GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../../data/plan'
import { StatCard } from '../StatCard'
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

  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.completed))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <StatCard label="Entrenos completados" value={String(stats.completedCount)} icon="✅" />
        <StatCard label="Racha" value={String(stats.streak)} unit={stats.streak === 1 ? 'día' : 'días'} icon="🔥" />
      </div>
      <div className="flex gap-3">
        <StatCard label="Km acumulados" value={stats.kmDone.toFixed(1)} unit="km" icon="📍" />
        <StatCard label={`Días para el ${GOAL_DISTANCE_KM}K`} value={String(daysRemaining)} icon="🗓️" />
      </div>

      <p className="text-xs text-ink-400 -mt-2">
        Esto es solo seguimiento de lo que vas haciendo — no una meta. Los descansos no cuentan como entrenos.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Entrenos por semana</h2>
        <div className="rounded-3xl bg-card shadow-card p-4 flex items-end gap-3 h-40">
          {stats.weeks.map((w, i) => {
            const pct = (w.completed / maxWeek) * 100
            return (
              <div key={w.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                <span className="text-xs font-semibold text-ink-700 tabular-nums">{w.completed}</span>
                <div className="w-full rounded-t-xl bg-ink-100 flex-1 flex flex-col justify-end overflow-hidden">
                  <div
                    className="w-full bg-brand-500 rounded-t-xl"
                    style={{ height: `${w.completed > 0 ? Math.max(pct, 8) : 0}%`, transition: 'height 0.3s ease' }}
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
