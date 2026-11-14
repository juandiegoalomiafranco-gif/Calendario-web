import { CalendarDays, Mail } from 'lucide-react'
import type { CalendarEvent } from '../../hooks/useCalendarEvents'

/**
 * Marca pequeña de dónde viene un evento. Los propios y los del colegio no llevan nada:
 * así lo nuevo (Google, Gmail) se distingue sin llenar de iconos lo de siempre.
 */
export function FuenteInsignia({ source }: { source: CalendarEvent['source'] }) {
  if (source === 'google') {
    return (
      <CalendarDays size={11} className="shrink-0 text-content-subtle" aria-label="De Google Calendar" />
    )
  }
  if (source === 'gmail') {
    return <Mail size={11} className="shrink-0 text-content-subtle" aria-label="Detectado en Gmail" />
  }
  return null
}
