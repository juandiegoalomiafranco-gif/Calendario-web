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
import { SCHOOL_EVENTS } from '../data/schoolCalendar'
import { createCollection, newId } from '../lib/cloudStore'
import { stableId } from '../lib/ids'

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
  /** 'colegio' = sembrado del calendario oficial; 'propio' = puesto por ti. */
  source?: 'colegio' | 'propio'
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
  source: string | null
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
    source: r.source === 'colegio' ? 'colegio' : 'propio',
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
    source: e.source ?? 'propio',
  }),
})

/**
 * Id estable a partir de la fecha y el título. El calendario del colegio se siembra
 * en cada dispositivo, así que los ids tienen que coincidir: si fueran aleatorios,
 * el celular y el computador crearían dos copias de cada evento.
 */
function seedId(date: string, title: string): string {
  return stableId('ccb', date, title)
}

/** Los eventos del calendario oficial, listos para insertar. */
export function schoolSeedEvents(): CalendarEvent[] {
  return SCHOOL_EVENTS.map((e) => ({
    id: seedId(e.date, e.title),
    date: e.date,
    title: e.title,
    type: 'colegio' as EventType,
    important: e.important ?? false,
    time: e.time,
    notes: e.notes,
    source: 'colegio' as const,
  }))
}

/**
 * Siembra automática, una vez por dispositivo. Los ids son deterministas, así que
 * si el celular y el computador siembran a la vez el resultado es el mismo: una
 * sola copia de cada evento. Si algún día borras eventos del colegio a mano, no
 * vuelven solos — la bandera ya quedó puesta.
 */
const SEED_FLAG = 'mivida:school-calendar-seeded:2026-2027'

if (typeof localStorage !== 'undefined' && !localStorage.getItem(SEED_FLAG)) {
  localStorage.setItem(SEED_FLAG, '1')
  for (const e of schoolSeedEvents()) store.upsert(e)
}

export function useCalendarEvents() {
  const events = store.useAll()

  /** Mete el año escolar completo. Es idempotente: repetirlo no duplica nada. */
  const seedSchoolYear = useCallback(() => {
    for (const e of schoolSeedEvents()) store.upsert(e)
  }, [])

  /** Quita solo lo sembrado por el colegio, dejando intacto lo tuyo. */
  const clearSchoolYear = useCallback(() => {
    for (const e of store.get()) if (e.source === 'colegio') store.remove(e.id)
  }, [])

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    store.upsert({ ...event, id: newId(), source: event.source ?? 'propio' })
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

  return {
    events,
    addEvent,
    updateEvent,
    toggleImportant,
    removeEvent,
    seedSchoolYear,
    clearSchoolYear,
  }
}
