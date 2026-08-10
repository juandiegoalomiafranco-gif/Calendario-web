import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PRINCIPLES, PROGRAM_START, getDayPlan } from '../data/plan'
import { formatKm } from '../data/program'
import { SessionCard } from '../components/SessionCard'
import { PrincipleCard } from '../components/PrincipleCard'
import { HolidayBadge } from '../components/HolidayBadge'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { useGoals } from '../hooks/useGoals'
import { holidayName } from '../data/holidays'
import { daysBetween, formatLong, todayISO } from '../lib/dates'

export function Today() {
  const iso = todayISO()
  const { activeGoal } = useGoals()
  const day = getDayPlan(iso, activeGoal)
  const { getEntry } = useTrainingLog()

  const principle = useMemo(() => {
    const idx = Math.max(0, daysBetween(PROGRAM_START, iso))
    return PRINCIPLES[idx % PRINCIPLES.length]
  }, [iso])

  const remaining = activeGoal ? daysBetween(iso, activeGoal.targetDate) : null
  const holiday = holidayName(iso)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-ink-500">{formatLong(iso)}</p>
        <h1 className="text-3xl font-bold text-ink-900">Hoy</h1>
        {holiday && <HolidayBadge name={holiday} className="mt-2" />}
      </header>

      {activeGoal && remaining !== null ? (
        <Link
          to="/metas"
          className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="min-w-0">
            <p className="text-sm text-ink-500">
              {activeGoal.targetKm ? `Meta: ${formatKm(activeGoal.targetKm)} km` : 'Tu próxima meta'}
            </p>
            <p className="text-base font-semibold text-ink-900 truncate">{activeGoal.title}</p>
            <p className="text-xs text-ink-400 mt-0.5">{formatLong(activeGoal.targetDate)}</p>
          </div>
          <div className="text-right shrink-0">
            {remaining === 0 ? (
              <p className="text-2xl font-bold text-brand-600">¡Hoy!</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-brand-600">{remaining}</p>
                <p className="text-xs text-ink-400">{remaining === 1 ? 'día restante' : 'días restantes'}</p>
              </>
            )}
          </div>
        </Link>
      ) : (
        <Link
          to="/metas"
          className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
        >
          <div>
            <p className="text-base font-semibold text-ink-900">🎯 Ponte tu próxima meta</p>
            <p className="text-sm text-ink-500 mt-0.5">El plan se organiza alrededor de ella.</p>
          </div>
          <span className="text-brand-600 text-xl shrink-0" aria-hidden>
            →
          </span>
        </Link>
      )}

      <PrincipleCard text={principle} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Entrenamiento de hoy</h2>
        {day && day.sessions.length > 0 ? (
          day.sessions.map((s) => (
            <SessionCard key={s.id} session={s} date={day.date} completed={getEntry(s.id)?.completed} from="/" />
          ))
        ) : (
          <p className="text-ink-500 text-sm">No hay un plan cargado para hoy todavía.</p>
        )}
        {day?.note && <p className="text-sm text-ink-500 bg-ink-100 rounded-2xl p-3">{day.note}</p>}
      </section>
    </div>
  )
}
