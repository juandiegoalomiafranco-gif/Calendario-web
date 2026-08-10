import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import type { Session } from '../data/types'
import { SessionDetail } from '../components/SessionDetail'
import { Card } from '../components/ui/Card'
import { formatDayMonth, yearOf } from '../lib/dates'

function SessionSection({ session }: { session: Session }) {
  const ref = useRef<HTMLDivElement>(null)
  const { sessionId } = useParams()

  // Al llegar desde una tarjeta concreta, esa sesión queda a la vista
  useEffect(() => {
    if (sessionId === session.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [sessionId, session.id])

  return (
    <div ref={ref} className="scroll-mt-4">
      <Card padding="lg">
        <SessionDetail session={session} />
      </Card>
    </div>
  )
}

export function DayDetail() {
  const { date } = useParams()
  const day = date ? getDayPlan(date) : undefined

  if (!day) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-content-muted">No encontramos ese día en el plan.</p>
        <Link
          to="/calendario"
          className="inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-full px-3 font-semibold text-brand hover:bg-brand-soft"
        >
          <ArrowLeft size={16} aria-hidden /> Volver al calendario
        </Link>
      </div>
    )
  }

  const holiday = holidayName(day.date)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <Link
          to={`/calendario?d=${day.date}`}
          className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-sm font-medium text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft size={16} aria-hidden /> Calendario
        </Link>
        <p className="mt-1 text-sm first-letter:uppercase text-content-muted">{day.weekday}</p>
        <h1 className="text-2xl font-bold tracking-tight text-content lg:text-3xl">
          {formatDayMonth(day.date)} de {yearOf(day.date)}
        </h1>
        {holiday && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
            <PartyPopper size={13} aria-hidden />
            Festivo · {holiday}
          </span>
        )}
      </header>

      {day.note && (
        <p className="rounded-2xl bg-brand-soft p-3.5 text-sm leading-relaxed text-content-muted">
          {day.note}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {day.sessions.map((s) => (
          <SessionSection key={s.id} session={s} />
        ))}
      </div>
    </div>
  )
}
