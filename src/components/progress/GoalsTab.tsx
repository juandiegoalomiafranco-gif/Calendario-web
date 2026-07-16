import { useMemo } from 'react'
import { GOAL_DATE, GOAL_DISTANCE_KM, PLAN, todayISO } from '../../data/plan'
import { MEASUREMENT_GOALS, NEXT_CONTROL_WEEKS, formatDateLong, metricValue } from '../../data/measurements'
import { useMeasurements } from '../../hooks/useMeasurements'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { GoalCard } from '../GoalCard'
import { ProgressRing } from '../ProgressRing'
import { computePlanStats } from './planStats'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function GoalsTab() {
  const { controls } = useMeasurements()
  const { log } = useTrainingLog()
  const iso = todayISO()

  const stats = useMemo(() => computePlanStats(log), [log])

  const daysRemaining = Math.max(
    0,
    Math.round((new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000),
  )
  const planStart = PLAN[0].date
  const totalDays = Math.round(
    (new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${planStart}T00:00:00Z`).getTime()) / 86_400_000,
  )
  const elapsedPct = totalDays > 0 ? Math.round(((totalDays - daysRemaining) / totalDays) * 100) : 0

  const lastControl = controls[controls.length - 1]
  const nextFrom = lastControl ? addDays(lastControl.date, NEXT_CONTROL_WEEKS[0] * 7) : undefined
  const nextTo = lastControl ? addDays(lastControl.date, NEXT_CONTROL_WEEKS[1] * 7) : undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Countdown al 21K */}
      <div className="rounded-4xl bg-card shadow-card p-5 flex items-center gap-5">
        <ProgressRing value={elapsedPct} size={104} strokeWidth={12} trackColor="#24262b" progressColor="#f43f5e">
          <div className="text-center">
            <p className="text-2xl font-bold text-ink-900">{daysRemaining}</p>
            <p className="text-[10px] text-ink-400 -mt-0.5">días</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-sm text-ink-500">Objetivo principal</p>
          <p className="text-xl font-bold text-ink-900">🎯 {GOAL_DISTANCE_KM} km</p>
          <p className="text-sm text-ink-500 mt-1">5 de agosto · {elapsedPct}% del camino recorrido</p>
        </div>
      </div>

      {/* Metas del entrenador */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Metas del próximo control</h2>
        {MEASUREMENT_GOALS.map((g) => {
          // Baseline: primer control con dato; actual: último con dato
          const series = controls.flatMap((c) => {
            const v = metricValue(c, g.metric)
            return v !== undefined ? [{ date: c.date, value: v }] : []
          })
          if (series.length === 0) return null
          // Punto de partida: el peor registro de la serie, para que la barra
          // mida el avance real hacia la meta (con el primer control puede salir
          // ya "cumplida" y engañar, p. ej. bíceps 36 → meta ≥ 35 → actual 34).
          const values = series.map((s) => s.value)
          const baseline = g.comparator === 'lt' ? Math.max(...values) : Math.min(...values)
          const current = series[series.length - 1]
          const prev = series.length > 1 ? series[series.length - 2] : undefined
          return (
            <GoalCard
              key={g.id}
              title={g.title}
              description={g.description}
              unit={g.unit}
              baseline={baseline}
              current={current.value}
              target={g.target}
              comparator={g.comparator}
              currentDate={formatDateLong(current.date)}
              lastDelta={prev ? current.value - prev.value : undefined}
            />
          )
        })}
      </section>

      {/* Próximo control */}
      {lastControl && nextFrom && nextTo && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
          <h3 className="text-base font-semibold text-ink-900">📏 Próximo control</h3>
          <p className="text-sm text-ink-600">
            Último control: <span className="capitalize font-medium text-ink-800">{formatDateLong(lastControl.date)}</span>.
            Tu entrenador pidió volver a medir en {NEXT_CONTROL_WEEKS[0]}-{NEXT_CONTROL_WEEKS[1]} semanas:{' '}
            <span className="font-semibold text-ink-900">
              entre el {formatDateLong(nextFrom)} y el {formatDateLong(nextTo)}
            </span>
            .
          </p>
          <div className="bg-ink-100 rounded-2xl p-3 text-sm text-ink-600">
            Mientras tanto, la receta del entrenador: <span className="font-medium text-ink-800">fuerza 3-4 veces por semana</span> y{' '}
            <span className="font-medium text-ink-800">proteína en cada comida</span>.
          </div>
        </div>
      )}

      {/* Resumen del plan */}
      <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-500">Entrenos completados</p>
          <p className="text-xl font-bold text-ink-900 tabular-nums">{stats.completedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-500">Km acumulados</p>
          <p className="text-xl font-bold text-ink-900 tabular-nums">{stats.kmDone.toFixed(1)} km</p>
        </div>
      </div>
    </div>
  )
}
