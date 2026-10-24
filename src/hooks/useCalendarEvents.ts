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
import { supabase } from '../lib/supabase'
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
 * Siembra automática del calendario oficial, una vez por dispositivo.
 *
 * Antes se sembraba al cargar, a ciegas: en un dispositivo nuevo (en el iPhone, Safari
 * y la app instalada tienen almacenamiento distinto) se volvían a subir todos los
 * eventos, y eso resucitaba los que se habían borrado y deshacía los editados. Ahora
 * se pregunta primero a la nube qué eventos del colegio existen —también los borrados—
 * y solo se crean los que nunca estuvieron. La bandera se pone solo si la consulta
 * salió bien; si no hay red, se intenta en la próxima apertura.
 */
const SEED_FLAG = 'mivida:school-calendar-seeded:2026-2027'
let sembrando = false

async function sembrarColegio() {
  if (sembrando || typeof localStorage === 'undefined' || localStorage.getItem(SEED_FLAG)) return
  sembrando = true
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('source', 'colegio')
    if (error) return
    const existentes = new Set((data ?? []).map((r: { id: string }) => r.id))
    for (const e of schoolSeedEvents()) {
      if (!existentes.has(e.id) && !store.get().some((x) => x.id === e.id)) store.upsert(e)
    }
    localStorage.setItem(SEED_FLAG, '1')
  } finally {
    sembrando = false
  }
}

if (typeof window !== 'undefined') {
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) void sembrarColegio()
  })
  supabase.auth.onAuthStateChange((evento, session) => {
    if (session && evento === 'SIGNED_IN') void sembrarColegio()
  })
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
