import { useMemo } from 'react'
import { PLAN, PRINCIPLES, GOAL_DATE, GOAL_DISTANCE_KM, todayISO, getDayPlan } from '../data/plan'
import { SessionCard } from '../components/SessionCard'
import { PrincipleCard } from '../components/PrincipleCard'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { holidayName } from '../data/holidays'
import { daysBetween, formatLongDate, formatDayMonth, capitalizeFirst } from '../lib/dates'
import { HolidayBadge } from '../components/HolidayBadge'

export function Today() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { getEntry } = useTrainingLog()

  const principle = useMemo(() => {
    const idx = PLAN.findIndex((d) => d.date === iso)
    return PRINCIPLES[(idx >= 0 ? idx : 0) % PRINCIPLES.length]
  }, [iso])

  const remaining = daysBetween(iso, GOAL_DATE)
  const holiday = holidayName(iso)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Hoy</h1>
        <p className="text-sm text-ink-500 mt-0.5">{capitalizeFirst(formatLongDate(iso))}</p>
        {holiday && (
          <div className="mt-2">
            <HolidayBadge name={holiday} />
          </div>
        )}
      </header>

      {remaining >= 0 && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Meta: {GOAL_DISTANCE_KM} km</p>
            <p className="text-base font-semibold text-ink-900">{formatDayMonth(GOAL_DATE)}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-600 tabular-nums">{remaining}</p>
            <p className="text-xs text-ink-400">{remaining === 1 ? 'día restante' : 'días restantes'}</p>
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
