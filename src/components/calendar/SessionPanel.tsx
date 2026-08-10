import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'
import type { Session } from '../../data/types'
import { formatDayMonth, weekdayLong } from '../../lib/dates'
import { SessionDetail } from '../SessionDetail'

interface SessionPanelProps {
  session: Session
  date: string
  onClose: () => void
}

/**
 * Panel lateral de escritorio: abre el detalle y el registro de una sesión sin
 * salir del calendario. En móvil no se usa — allí se navega a la página del día.
 */
export function SessionPanel({ session, date, onClose }: SessionPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside
      role="dialog"
      aria-label={`Detalle de ${session.title}`}
      className="scroll-slim fixed inset-y-0 right-0 z-40 w-[380px] overflow-y-auto border-l border-line bg-surface shadow-lg"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs first-letter:uppercase text-content-muted">{weekdayLong(date)}</p>
          <p className="truncate text-base font-semibold tracking-tight text-content">
            {formatDayMonth(date)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
        >
          <X size={17} aria-hidden />
        </button>
      </div>

      <div className="px-5 py-5">
        <SessionDetail session={session} />

        <Link
          to={`/dia/${date}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          Ver el día completo
          <ArrowUpRight size={15} aria-hidden />
        </Link>
      </div>
    </aside>
  )
}
