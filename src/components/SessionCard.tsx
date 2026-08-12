import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SESSION_META } from '../data/sessionMeta'
import type { Session } from '../data/types'
import { cx } from '../lib/cx'

interface SessionCardProps {
  session: Session
  date: string
  completed?: boolean
}

const SLOT_LABEL = { AM: 'Mañana', PM: 'Tarde', ALL: 'Todo el día' } as const

/** Tarjeta de sesión de entrenamiento que lleva a su detalle. */
export function SessionCard({ session, date, completed }: SessionCardProps) {
  const meta = SESSION_META[session.type]
  const detail = [session.distanceKm && `${session.distanceKm} km`, session.pace, session.hrTarget]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      to={`/dia/${date}/${session.id}`}
      className={cx(
        'flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lg',
        completed && 'opacity-70',
      )}
    >
      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', meta.color.soft)}>
        <meta.Icon size={19} strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
            {SLOT_LABEL[session.slot]}
          </span>
          {completed && (
            <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-bold text-ok">
              Hecho
            </span>
          )}
        </div>
        <h3
          className={cx(
            'mt-0.5 truncate text-[15px] font-bold text-content',
            completed && 'line-through',
          )}
        >
          {session.title}
        </h3>
        {detail && <p className="mt-0.5 truncate text-xs text-content-muted">{detail}</p>}
      </div>

      <ChevronRight size={17} className="shrink-0 text-content-subtle" aria-hidden />
    </Link>
  )
}
