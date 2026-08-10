import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { activityOf } from '../../data/activityMeta'
import type { Session } from '../../data/types'
import { formatRange, scheduleLabel, sessionTimeRange } from '../../lib/schedule'
import { cx } from '../../lib/cx'

interface EventProps {
  session: Session
  completed?: boolean
  onSelect: (session: Session) => void
}

/** Bloque de la rejilla horaria. El padre lo posiciona con `style`. */
export function EventBlock({
  session,
  completed,
  onSelect,
  style,
  heightPx,
}: EventProps & { style: CSSProperties; heightPx: number }) {
  const activity = activityOf(session.type)
  const range = sessionTimeRange(session)

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      style={style}
      className={cx(
        'absolute overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left',
        'transition-shadow duration-150 hover:z-10 hover:shadow-card',
        activity.soft,
        activity.accent,
      )}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="truncate text-[11.5px] font-semibold leading-tight">{session.summary}</span>
        {completed && <Check size={12} strokeWidth={3} className="mt-0.5 shrink-0" aria-hidden />}
      </span>
      {heightPx >= 46 && range && (
        <span className="mt-0.5 block truncate text-[10.5px] opacity-80">{formatRange(range)}</span>
      )}
      {heightPx >= 74 && session.pace && (
        <span className="mt-0.5 block truncate text-[10.5px] opacity-80">{session.pace}</span>
      )}
    </button>
  )
}

/** Chip compacto de las celdas de la vista de mes. */
export function EventChip({ session, completed, onSelect }: EventProps) {
  const activity = activityOf(session.type)

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className={cx(
        'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-opacity hover:opacity-80',
        activity.soft,
      )}
    >
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', activity.dot)} />
      <span className="truncate text-[11px] font-medium leading-tight">{session.summary}</span>
      {completed && <Check size={10} strokeWidth={3} className="ml-auto shrink-0" aria-hidden />}
    </button>
  )
}

/** Fila de la agenda de móvil: barra de color, título y datos de la sesión. */
export function EventRow({ session, completed, onSelect }: EventProps) {
  const activity = activityOf(session.type)
  const meta = [session.distanceKm && `${session.distanceKm} km`, session.pace]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className="flex w-full items-stretch gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-transform active:scale-[0.99]"
    >
      <span className={cx('w-1 shrink-0 rounded-full', activity.dot)} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-subtle">
            {scheduleLabel(session)}
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-1.5 py-0.5 text-[10px] font-semibold text-ok">
              <Check size={9} strokeWidth={3} aria-hidden /> Hecho
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-content">
          {session.title}
        </span>
        {meta && <span className="mt-0.5 block truncate text-xs text-content-muted">{meta}</span>}
      </span>
      <span className={cx('grid h-9 w-9 shrink-0 place-items-center self-center rounded-xl', activity.soft)}>
        <activity.Icon size={16} strokeWidth={2} aria-hidden />
      </span>
    </button>
  )
}
