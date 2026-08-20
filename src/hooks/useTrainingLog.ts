import { useCallback, useMemo } from 'react'
import type { LogEntry } from '../data/types'
import { createCollection } from '../lib/cloudStore'
import { stableId } from '../lib/ids'

/** Una entrada del registro, con la identidad de su fila en la nube. */
interface LogItem extends LogEntry {
  id: string
  sessionId: string
}

interface Row {
  id: string
  session_id: string
  completed: boolean
  duration_min: number | null
  calories: number | null
  avg_hr: number | null
  activity: string | null
  feeling: string | null
  notes: string | null
}

const STORAGE_KEY = 'mivida:training-log:v1'
const LEGACY_KEY = 'calendario-web:log:v1'

/**
 * Una fila por sesión del plan. El id sale del `session_id`, así que el celular y
 * el computador llegan al mismo y no se crean dos filas para el mismo entreno.
 */
function rowId(sessionId: string): string {
  return stableId('log', sessionId)
}

/**
 * La versión anterior de este hook guardaba el registro como un objeto suelto en
 * otra clave, leía de la nube una sola vez al arrancar y perdía cualquier cambio
 * escrito sin señal. Lo que quedara en esa caché se pasa una vez al formato nuevo;
 * de ahí en adelante lo sube la cola de salida como el resto de la app.
 */
function importarCacheVieja() {
  try {
    if (localStorage.getItem(STORAGE_KEY) != null) return
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const viejo = JSON.parse(raw) as Record<string, LogEntry>
    const items: LogItem[] = Object.entries(viejo).map(([sessionId, e]) => ({
      id: rowId(sessionId),
      sessionId,
      completed: e.completed ?? false,
      durationMin: e.durationMin,
      calories: e.calories,
      avgHr: e.avgHr,
      activity: e.activity,
      feeling: e.feeling,
      notes: e.notes,
    }))
    if (items.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Caché vieja ilegible: se arranca limpio y manda lo que haya en la nube.
  }
}

if (typeof localStorage !== 'undefined') importarCacheVieja()

const store = createCollection<LogItem, Row>({
  key: STORAGE_KEY,
  table: 'training_log',
  rowToItem: (r) => ({
    id: r.id,
    sessionId: r.session_id,
    completed: r.completed,
    durationMin: r.duration_min ?? undefined,
    calories: r.calories ?? undefined,
    avgHr: r.avg_hr ?? undefined,
    activity: (r.activity as LogEntry['activity']) ?? undefined,
    feeling: (r.feeling as LogEntry['feeling']) ?? undefined,
    notes: r.notes ?? undefined,
  }),
  itemToRow: (i, userId) => ({
    id: i.id,
    user_id: userId,
    session_id: i.sessionId,
    // Los session.id empiezan por YYYY-MM-DD (p. ej. "2026-07-15-am").
    date: /^\d{4}-\d{2}-\d{2}/.test(i.sessionId) ? i.sessionId.slice(0, 10) : null,
    completed: i.completed ?? false,
    duration_min: i.durationMin ?? null,
    calories: i.calories ?? null,
    avg_hr: i.avgHr ?? null,
    activity: i.activity ?? null,
    feeling: i.feeling ?? null,
    notes: i.notes ?? null,
  }),
})

export function useTrainingLog() {
  const items = store.useAll()

  // Las pantallas consultan por id de sesión, no por id de fila.
  const log = useMemo(() => {
    const porSesion: Record<string, LogEntry> = {}
    for (const item of items) porSesion[item.sessionId] = item
    return porSesion
  }, [items])

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    store.upsert({ ...entry, id: rowId(sessionId), sessionId })
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    const actual = store.get().find((x) => x.sessionId === sessionId)
    const base: LogItem = actual ?? { id: rowId(sessionId), sessionId, completed: false }
    store.upsert({ ...base, completed: !base.completed })
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
