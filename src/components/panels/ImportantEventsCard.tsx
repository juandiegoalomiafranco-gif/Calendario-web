import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, CalendarPlus } from 'lucide-react'
import { EVENT_TYPE_META, useCalendarEvents } from '../../hooks/useCalendarEvents'
import { formatDayMonth, relativeDay, todayIso } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

interface ImportantEventsCardProps {
  limit?: number
  className?: string
}

/**
 * Próximos eventos marcados como importantes, mostrando **qué tipo son y cuándo**.
 * Si no hay ninguno marcado, muestra los siguientes eventos cualesquiera.
 */
export function ImportantEventsCard({ limit = 4, className }: ImportantEventsCardProps) {
  const { events } = useCalendarEvents()
  const today = todayIso()

  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))

  const important = upcoming.filter((e) => e.important)
  const shown = (important.length > 0 ? important : upcoming).slice(0, limit)
  const onlyImportant = important.length > 0

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title={onlyImportant ? 'Eventos importantes' : 'Próximos eventos'}
        action={
          <Link
            to="/calendario"
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
          >
            Calendario
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        }
      />

      {shown.length === 0 ? (
        <Link
          to="/calendario"
          className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-8 text-center transition-colors hover:bg-surface-2"
        >
          <CalendarPlus size={20} className="text-content-subtle" aria-hidden />
          <p className="text-sm text-content-muted">Aún no tienes eventos.</p>
          <p className="text-xs text-content-subtle">Añade el primero en el calendario</p>
        </Link>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((e) => {
            const meta = EVENT_TYPE_META[e.type] ?? EVENT_TYPE_META.otro
            return (
              <li key={e.id}>
                <Link
                  to={`/calendario?d=${e.date}`}
                  className="flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cx(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                      meta.color.soft,
                    )}
                  >
                    <meta.Icon size={17} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className={cx('text-[11px] font-bold uppercase tracking-wide', meta.color.text)}>
                        {meta.label}
                      </span>
                      {e.important && (
                        <Bookmark
                          size={11}
                          strokeWidth={2.5}
                          className="fill-current text-accent"
                          aria-label="Importante"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold text-content">
                      {e.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-content-muted">
                      {formatDayMonth(e.date)}
                      {e.time ? ` · ${e.time}` : ''} · {relativeDay(e.date)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
