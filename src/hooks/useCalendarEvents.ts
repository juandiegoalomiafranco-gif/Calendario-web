import { useCallback } from 'react'
import {
  Bookmark,
  Cake,
  GraduationCap,
  HeartPulse,
  MapPin,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { COLORS, type ColorStyles } from '../data/palette'
import { createCollection, newId } from '../lib/cloudStore'

export type EventType = 'personal' | 'colegio' | 'salud' | 'viaje' | 'cumpleanos' | 'otro'

export interface CalendarEvent {
  id: string
  date: string
  title: string
  type: EventType
  /** Marcador: lo destaca en la rejilla y lo sube a «Eventos importantes». */
  important: boolean
  /** Hora opcional, "18:30". */
  time?: string
  notes?: string
}

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; Icon: LucideIcon; color: ColorStyles }
> = {
  personal: { label: 'Personal', Icon: Sparkles, color: COLORS.violet },
  colegio: { label: 'Colegio', Icon: GraduationCap, color: COLORS.blue },
  salud: { label: 'Salud', Icon: HeartPulse, color: COLORS.rose },
  viaje: { label: 'Viaje', Icon: MapPin, color: COLORS.teal },
  cumpleanos: { label: 'Cumpleaños', Icon: Cake, color: COLORS.amber },
  otro: { label: 'Otro', Icon: Bookmark, color: COLORS.slate },
}

export const EVENT_TYPE_ORDER: EventType[] = [
  'personal',
  'colegio',
  'salud',
  'viaje',
  'cumpleanos',
  'otro',
]

interface EventRow {
  id: string
  date: string
  title: string | null
  type: string
  important: boolean | null
  time: string | null
  notes: string | null
}

const store = createCollection<CalendarEvent, EventRow>({
  key: 'mivida:calendar-events:v1',
  table: 'calendar_events',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    title: r.title ?? '',
    // Los eventos anteriores usaban el tipo «importante»: se traduce al marcador.
    type: (EVENT_TYPE_META[r.type as EventType] ? (r.type as EventType) : 'otro'),
    important: r.important ?? r.type === 'importante',
    time: r.time ?? undefined,
    notes: r.notes ?? undefined,
  }),
  itemToRow: (e, userId) => ({
    id: e.id,
    user_id: userId,
    date: e.date,
    title: e.title,
    type: e.type,
    important: e.important,
    time: e.time ?? null,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

export function useCalendarEvents() {
  const events = store.useAll()

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    store.upsert({ ...event, id: newId() })
  }, [])

  const updateEvent = useCallback((event: CalendarEvent) => {
    store.upsert(event)
  }, [])

  const toggleImportant = useCallback((id: string) => {
    const e = store.get().find((x) => x.id === id)
    if (e) store.upsert({ ...e, important: !e.important })
  }, [])

  const removeEvent = useCallback((id: string) => {
    store.remove(id)
  }, [])

  return { events, addEvent, updateEvent, toggleImportant, removeEvent }
}
