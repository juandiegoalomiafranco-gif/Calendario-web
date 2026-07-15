import { Link } from 'react-router-dom'
import type { Session } from '../data/types'
import { SESSION_META } from '../data/sessionMeta'

interface SessionCardProps {
  session: Session
  date: string
  completed?: boolean
}

export function SessionCard({ session, date, completed }: SessionCardProps) {
  const meta = SESSION_META[session.type]

  return (
    <Link
      to={`/dia/${date}/${session.id}`}
      className="block rounded-3xl bg-white shadow-card p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-11 h-11 rounded-2xl ${meta.bg} ${meta.text} flex items-center justify-center text-xl`}>
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              {session.slot === 'AM' ? 'Mañana' : session.slot === 'PM' ? 'Tarde' : 'Todo el día'}
            </span>
            {completed && (
              <span className="text-[11px] font-semibold text-ok-600 bg-ok-100 rounded-full px-2 py-0.5">
                Hecho
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-ink-900 mt-0.5 truncate">{session.title}</h3>
          {(session.distanceKm || session.pace) && (
            <p className="text-sm text-ink-500 mt-0.5">
              {session.distanceKm ? `${session.distanceKm} km` : ''}
              {session.distanceKm && session.pace ? ' · ' : ''}
              {session.pace ?? ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
