import { useCallback, useSyncExternalStore } from 'react'
import type { LogEntry } from '../data/types'

const STORAGE_KEY = 'calendario-web:log:v1'

type LogMap = Record<string, LogEntry>

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

function write(next: LogMap) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sin espacio o modo privado: mantenemos al menos el estado en memoria
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTrainingLog() {
  const log = useSyncExternalStore(subscribe, () => cache)

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    write({ ...cache, [sessionId]: entry })
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    const existing = cache[sessionId]
    write({ ...cache, [sessionId]: { ...existing, completed: !existing?.completed } })
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
