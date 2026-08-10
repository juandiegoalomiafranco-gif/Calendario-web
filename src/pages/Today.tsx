import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, PartyPopper, Target } from 'lucide-react'
import { PLAN, PRINCIPLES, GOAL_DATE, GOAL_DISTANCE_KM, todayISO, getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import { SessionCard } from '../components/SessionCard'
import { PrincipleCard } from '../components/PrincipleCard'
import { ProgressRing } from '../components/ProgressRing'
import { Card } from '../components/ui/Card'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { completionRate } from '../lib/stats'
import { daysBetween, formatDayMonth, weekDays, weekdayLong } from '../lib/dates'
import { PLAN_END, PLAN_START, sessionsOn } from '../lib/planQuery'

export function Today() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { log, getEntry } = useTrainingLog()

  const principle = useMemo(() => {
    const idx = PLAN.findIndex((d) => d.date === iso)
    return PRINCIPLES[(idx >= 0 ? idx : 0) % PRINCIPLES.length]
  }, [iso])

  const daysToGoal = daysBetween(iso, GOAL_DATE)
  const holiday = holidayName(iso)
  const { done, planned, pct } = completionRate(PLAN, log, iso)

  // Resumen de la semana en curso para la columna lateral de escritorio
  const week = useMemo(() => {
    const days = weekDays(iso)
    const sessions = days.flatMap((d) => sessionsOn(d)).filter((s) => s.type !== 'rest')
    const completed = sessions.filter((s) => log[s.id]?.completed).length
    return { days, total: sessions.length, completed }
  }, [iso, log])

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">
        <header>
          <p className="text-sm first-letter:uppercase text-content-muted">
            {day?.weekday ?? weekdayLong(iso)}, {formatDayMonth(iso)}
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-content lg:text-4xl">Hoy</h1>
          {holiday && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
              <PartyPopper size={13} aria-hidden />
              Festivo · {holiday}
            </span>
          )}
        </header>

        {/* En móvil la meta va arriba; en escritorio vive en la columna derecha */}
        <Card className="flex items-center justify-between gap-4 lg:hidden">
          <div>
            <p className="text-sm text-content-muted">Meta: {GOAL_DISTANCE_KM} km</p>
            <p className="text-base font-semibold text-content">5 de agosto</p>
          </div>
          <div className="text-right">
            {daysToGoal >= 0 ? (
              <>
                <p className="text-3xl font-bold tabular text-brand">{daysToGoal}</p>
                <p className="text-xs text-content-subtle">
                  {daysToGoal === 1 ? 'día restante' : 'días restantes'}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-ok">Plan completado</p>
            )}
          </div>
        </Card>

        <PrincipleCard text={principle} />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-content">
              Entrenamiento de hoy
            </h2>
            <Link
              to={`/calendario?d=${iso}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Ver calendario
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>

          {day && day.sessions.length > 0 ? (
            day.sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                date={day.date}
                completed={getEntry(s.id)?.completed}
              />
            ))
          ) : (
            <Card className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarDays size={22} className="text-content-subtle" aria-hidden />
              <p className="text-sm text-content-muted">
                No hay un plan cargado para hoy todavía.
              </p>
              <p className="text-xs text-content-subtle">
                El plan va del {formatDayMonth(PLAN_START)} al {formatDayMonth(PLAN_END)}.
              </p>
              <Link
                to="/calendario"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                Ver el calendario
                <ArrowUpRight size={14} aria-hidden />
              </Link>
            </Card>
          )}

          {day?.note && (
            <p className="rounded-2xl bg-surface-2 p-3.5 text-sm leading-relaxed text-content-muted">
              {day.note}
            </p>
          )}
        </section>
      </div>

      {/* Columna lateral de escritorio: meta, cumplimiento y semana */}
      <aside className="hidden flex-col gap-4 lg:flex">
        <Card padding="lg" className="flex items-center gap-4">
          <ProgressRing value={pct} size={88} strokeWidth={9}>
            <span className="text-lg font-bold tabular text-content">{pct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm text-content-muted">Sesiones completadas</p>
            <p className="text-xl font-bold tabular text-content">
              {done} / {planned}
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-2 text-content-muted">
            <Target size={16} aria-hidden />
            <span className="text-sm">Meta {GOAL_DISTANCE_KM} km</span>
          </div>
          {daysToGoal >= 0 ? (
            <>
              <p className="mt-2 text-4xl font-bold tabular tracking-tight text-brand">
                {daysToGoal}
              </p>
              <p className="text-sm text-content-muted">
                {daysToGoal === 0
                  ? '¡Es hoy! 5 de agosto'
                  : `${daysToGoal === 1 ? 'día' : 'días'} para el 5 de agosto`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ok">Plan completado</p>
              <p className="text-sm text-content-muted">El intento era el 5 de agosto</p>
            </>
          )}
        </Card>

        <Card padding="lg">
          <p className="text-sm font-semibold text-content">Esta semana</p>
          <p className="mt-1 text-sm text-content-muted">
            {week.completed} de {week.total} entrenos hechos
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-ok"
              style={{
                width: `${week.total ? (week.completed / week.total) * 100 : 0}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </Card>
      </aside>
    </div>
  )
}
