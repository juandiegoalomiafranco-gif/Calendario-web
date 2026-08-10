import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { activityOf } from '../data/activityMeta'
import type { Session } from '../data/types'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { timingLabel } from '../lib/schedule'
import { cx } from '../lib/cx'

interface SessionCardProps {
  session: Session
  date: string
  completed?: boolean
}

/** Tarjeta de sesión de la pantalla Hoy, con registro directo de "hecha". */
export function SessionCard({ session, date, completed }: SessionCardProps) {
  const activity = activityOf(session.type)
  const { toggleCompleted } = useTrainingLog()
  const meta = [session.distanceKm && `${session.distanceKm} km`, session.pace, session.hrTarget]
    .filter(Boolean)
    .join(' · ')

  return (
    // El enlace se estira sobre toda la tarjeta para que el botón de "hecha"
    // quede fuera de él y siga siendo HTML válido.
    <div className="relative flex items-start gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lg">
      <Link
        to={`/dia/${date}/${session.id}`}
        className="absolute inset-0 rounded-3xl"
        aria-label={`Ver detalle de ${session.title}`}
      />

      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', activity.soft)}>
        <activity.Icon size={20} strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-content-subtle">
          {timingLabel(session)}
        </p>
        <h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight text-content">
          {session.title}
        </h3>
        {meta && <p className="mt-1 text-sm text-content-muted">{meta}</p>}
      </div>

      <button
        type="button"
        onClick={() => toggleCompleted(session.id)}
        aria-pressed={completed}
        aria-label={completed ? 'Marcar como no hecha' : 'Marcar como hecha'}
        className={cx(
          'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors',
          completed
            ? 'border-transparent bg-ok text-white'
            : 'border-line-strong text-content-subtle hover:border-brand hover:text-brand',
        )}
      >
        <Check size={17} strokeWidth={3} aria-hidden />
      </button>
    </div>
  )
}
