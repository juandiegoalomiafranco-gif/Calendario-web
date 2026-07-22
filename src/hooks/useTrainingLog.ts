import { useCallback, useSyncExternalStore } from 'react'
import type { LogEntry } from '../data/types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'calendario-web:log:v1'

type LogMap = Record<string, LogEntry>

// --- Caché local: carga instantánea y lectura offline ------------------------
function readStorage(): LogMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LogMap) : {}
  } catch {
    return {}
  }
}

// Store compartido a nivel de módulo: todas las instancias del hook ven el mismo
// log, así dos tarjetas de un mismo día no se pisan las entradas entre sí.
let cache: LogMap = readStorage()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function persistLocal(next: LogMap) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sin espacio o modo privado: mantenemos al menos el estado en memoria
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- Mapeo fila (Supabase) <-> LogEntry (app) --------------------------------
interface Row {
  session_id: string
  completed: boolean
  distance_km: number | null
  duration_min: number | null
  calories: number | null
  avg_hr: number | null
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
    avgHr: r.avg_hr ?? undefined,
    activity: (r.activity as LogEntry['activity']) ?? undefined,
    feeling: (r.feeling as LogEntry['feeling']) ?? undefined,
    notes: r.notes ?? undefined,
  }
}

function entryToRow(sessionId: string, userId: string, e: LogEntry) {
  // Los session.id empiezan por YYYY-MM-DD (p. ej. "2026-07-15-am"); derivamos la fecha.
  const date = /^\d{4}-\d{2}-\d{2}/.test(sessionId) ? sessionId.slice(0, 10) : null
  return {
    user_id: userId,
    session_id: sessionId,
    date,
    completed: e.completed ?? false,
    distance_km: e.distanceKm ?? null,
    duration_min: e.durationMin ?? null,
    calories: e.calories ?? null,
    avg_hr: e.avgHr ?? null,
    activity: e.activity ?? null,
    feeling: e.feeling ?? null,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }
}

// --- Sincronización con Supabase ---------------------------------------------
let currentUserId: string | null = null

async function loadFromSupabase() {
  const { data, error } = await supabase.from('training_log').select('*')
  if (error || !data) return // sin conexión / error: nos quedamos con la caché local
  const map: LogMap = {}
  for (const r of data as Row[]) map[r.session_id] = rowToEntry(r)
  persistLocal(map)
}

function pushToSupabase(sessionId: string, entry: LogEntry) {
  if (!currentUserId) return
  supabase
    .from('training_log')
    .upsert(entryToRow(sessionId, currentUserId, entry), { onConflict: 'user_id,session_id' })
    .then(({ error }) => {
      if (error) console.error('No se pudo guardar el entrenamiento:', error.message)
    })
}

// Recargar al entrar y limpiar al salir, para no mezclar datos entre usuarios.
supabase.auth.getSession().then(({ data }) => {
  currentUserId = data.session?.user.id ?? null
  if (currentUserId) loadFromSupabase()
})
supabase.auth.onAuthStateChange((_event, session) => {
  const nextId = session?.user.id ?? null
  if (nextId === currentUserId) return
  currentUserId = nextId
  if (nextId) loadFromSupabase()
  else persistLocal({})
})

export function useTrainingLog() {
  const log = useSyncExternalStore(subscribe, () => cache)

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    persistLocal({ ...cache, [sessionId]: entry }) // optimista + caché
    pushToSupabase(sessionId, entry)
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    const next: LogEntry = { ...cache[sessionId], completed: !cache[sessionId]?.completed }
    persistLocal({ ...cache, [sessionId]: next })
    pushToSupabase(sessionId, next)
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
