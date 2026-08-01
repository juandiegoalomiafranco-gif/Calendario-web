import { useCallback, useSyncExternalStore } from 'react'
import type { LogEntry } from '../data/types'
import { supabase } from '../lib/supabase'
import { createCloudStore } from '../lib/cloudStore'

type LogMap = Record<string, LogEntry>

// --- Mapeo fila (Supabase) <-> LogEntry (app) --------------------------------
interface Row {
  session_id: string
  completed: boolean
  distance_km: number | null
  duration_min: number | null
  calories: number | null
  activity: string | null
  feeling: string | null
  notes: string | null
}

function rowToEntry(r: Row): LogEntry {
  return {
    completed: r.completed,
    distanceKm: r.distance_km ?? undefined,
    durationMin: r.duration_min ?? undefined,
    calories: r.calories ?? undefined,
    activity: (r.activity as LogEntry['activity']) ?? undefined,
    feeling: (r.feeling as LogEntry['feeling']) ?? undefined,
    notes: r.notes ?? undefined,
  }
}

function entryToRow(sessionId: string, userId: string, e: LogEntry) {
  // Los session.id empiezan por YYYY-MM-DD (p. ej. "2026-07-15-am"); derivamos la fecha.
  const date = /^\d{4}-\d{2}-\d{2}/.test(sessionId) ? sessionId.slice(0, 10) : null
  // `avg_hr` ya no se escribe (la app dejó de pedir frecuencia cardíaca), pero la
  // columna sigue en la base: el upsert solo toca las columnas que van aquí, así
  // que los valores que registraste antes se conservan.
  return {
    user_id: userId,
    session_id: sessionId,
    date,
    completed: e.completed ?? false,
    distance_km: e.distanceKm ?? null,
    duration_min: e.durationMin ?? null,
    calories: e.calories ?? null,
    activity: e.activity ?? null,
    feeling: e.feeling ?? null,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }
}

const store = createCloudStore<LogMap>({
  storageKey: 'calendario-web:log:v1',
  initial: {},
  load: async () => {
    const { data, error } = await supabase.from('training_log').select('*')
    if (error || !data) return null // sin conexión / error: nos quedamos con la caché local
    const map: LogMap = {}
    for (const r of data as Row[]) map[r.session_id] = rowToEntry(r)
    return map
  },
})

function pushEntry(sessionId: string, entry: LogEntry) {
  const userId = store.userId()
  if (!userId) return
  void supabase
    .from('training_log')
    .upsert(entryToRow(sessionId, userId, entry), { onConflict: 'user_id,session_id' })
    .then(({ error }) => {
      if (error) console.error('No se pudo guardar el entrenamiento:', error.message)
    })
}

export function useTrainingLog() {
  const log = useSyncExternalStore(store.subscribe, store.snapshot)

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    store.setLocal({ ...store.snapshot(), [sessionId]: entry }) // optimista + caché
    pushEntry(sessionId, entry)
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    const current = store.snapshot()
    const next: LogEntry = { ...current[sessionId], completed: !current[sessionId]?.completed }
    store.setLocal({ ...current, [sessionId]: next })
    pushEntry(sessionId, next)
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
