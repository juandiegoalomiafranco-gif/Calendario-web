import { useCallback } from 'react'
import { createCollection, newId } from '../lib/cloudStore'

export type EventType = 'importante' | 'colegio' | 'entreno' | 'otro'

export interface CalendarEvent {
  id: string
  date: string
  title: string
  type: EventType
  notes?: string
}

export const EVENT_TYPE_META: Record<EventType, { label: string; dot: string; pill: string }> = {
  importante: { label: 'Importante', dot: 'bg-brand-600', pill: 'bg-brand-600 text-white' },
  colegio: { label: 'Colegio', dot: 'bg-sky-500', pill: 'bg-sky-500 text-white' },
  entreno: { label: 'Entreno', dot: 'bg-ok-500', pill: 'bg-ok-500 text-white' },
  otro: { label: 'Otro', dot: 'bg-ink-400', pill: 'bg-ink-200 text-ink-800' },
}

interface EventRow {
  id: string
  date: string
  title: string | null
  type: string
  notes: string | null
}

const store = createCollection<CalendarEvent, EventRow>({
  key: 'mivida:calendar-events:v1',
  table: 'calendar_events',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    title: r.title ?? '',
    type: (r.type as EventType) ?? 'otro',
    notes: r.notes ?? undefined,
  }),
  itemToRow: (e, userId) => ({
    id: e.id,
    user_id: userId,
    date: e.date,
    title: e.title,
    type: e.type,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

export function useCalendarEvents() {
  const events = store.useAll()

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    store.upsert({ ...event, id: newId() })
  }, [])

  const removeEvent = useCallback((id: string) => {
    store.remove(id)
  }, [])

  return { events, addEvent, removeEvent }
}
