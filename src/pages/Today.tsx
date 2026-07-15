import { useMemo } from 'react'
import { GOAL_DATE, GOAL_DISTANCE_KM, todayISO, getDayPlan } from '../data/plan'
import { quoteForDate } from '../data/quotes'
import { SessionCard } from '../components/SessionCard'
import { QuoteCard } from '../components/QuoteCard'
import { RecoveryCard } from '../components/RecoveryCard'
import { AddActivityForm } from '../components/AddActivityForm'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { mergeDay, useCustomActivities } from '../hooks/useCustomActivities'

function daysUntil(dateIso: string): number {
  const today = new Date(`${todayISO()}T00:00:00Z`)
  const target = new Date(`${dateIso}T00:00:00Z`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function Today() {
  const iso = todayISO()
  const planDay = getDayPlan(iso)
  const { getEntry } = useTrainingLog()
  const { forDate } = useCustomActivities()

  const customs = forDate(iso)
  const day = useMemo(() => (planDay ? mergeDay(planDay, customs) : undefined), [planDay, customs])

  const quote = useMemo(() => quoteForDate(iso), [iso])

  const remaining = daysUntil(GOAL_DATE)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-ink-500 capitalize">{day?.weekday ?? ''}</p>
        <h1 className="text-3xl font-bold text-ink-900">Hoy</h1>
      </header>

      {remaining >= 0 && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Meta: {GOAL_DISTANCE_KM} km</p>
            <p className="text-base font-semibold text-ink-900">5 de agosto</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-500">{remaining}</p>
            <p className="text-xs text-ink-400">días restantes</p>
          </div>
        </div>
      )}

      <QuoteCard text={quote.text} author={quote.author} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Entrenamiento de hoy</h2>
        {day && day.sessions.length > 0 ? (
          day.sessions.map((s) => (
            <SessionCard key={s.id} session={s} date={day.date} completed={getEntry(s.id)?.completed} />
          ))
        ) : (
          <p className="text-ink-500 text-sm">No hay un plan cargado para hoy todavía.</p>
        )}
        {day?.recovery && <RecoveryCard date={day.date} recovery={day.recovery} />}
        {day && <AddActivityForm date={iso} />}
        {day?.note && (
          <p className="text-sm text-ink-500 bg-ink-100 rounded-2xl p-3">{day.note}</p>
        )}
      </section>
    </div>
  )
}
