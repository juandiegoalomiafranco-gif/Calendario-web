import { useMemo } from 'react'
import { PLAN, PRINCIPLES, GOAL_DATE, GOAL_DISTANCE_KM, todayISO, getDayPlan } from '../data/plan'
import { SessionCard } from '../components/SessionCard'
import { PrincipleCard } from '../components/PrincipleCard'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { holidayName } from '../data/holidays'

function daysUntil(dateIso: string): number {
  const today = new Date(`${todayISO()}T00:00:00Z`)
  const target = new Date(`${dateIso}T00:00:00Z`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function Today() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { getEntry } = useTrainingLog()

  const principle = useMemo(() => {
    const idx = PLAN.findIndex((d) => d.date === iso)
    return PRINCIPLES[(idx >= 0 ? idx : 0) % PRINCIPLES.length]
  }, [iso])

  const remaining = daysUntil(GOAL_DATE)
  const holiday = holidayName(iso)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-ink-500 capitalize">{day?.weekday ?? ''}</p>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Hoy</h1>
        {holiday && (
          <span className="inline-flex items-center gap-1 mt-2 rounded-full px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-200">
            🇨🇴 Festivo · {holiday}
          </span>
        )}
      </header>

      {remaining >= 0 && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Meta: {GOAL_DISTANCE_KM} km</p>
            <p className="text-base font-semibold text-ink-900">5 de agosto</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-600">{remaining}</p>
            <p className="text-xs text-ink-400">días restantes</p>
          </div>
        </div>
      )}

      <PrincipleCard text={principle} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Entrenamiento de hoy</h2>
        {day && day.sessions.length > 0 ? (
          day.sessions.map((s) => (
            <SessionCard key={s.id} session={s} date={day.date} completed={getEntry(s.id)?.completed} />
          ))
        ) : (
          <p className="text-ink-500 text-sm">No hay un plan cargado para hoy todavía.</p>
        )}
        {day?.note && (
          <p className="text-sm text-ink-500 bg-ink-100 rounded-2xl p-3">{day.note}</p>
        )}
      </section>
    </div>
  )
}
