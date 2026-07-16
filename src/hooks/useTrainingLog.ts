import { useCallback, useSyncExternalStore } from 'react'
import type { LogEntry } from '../data/types'

const STORAGE_KEY = 'calendario-web:log:v1'

type LogMap = Record<string, LogEntry>

function readStorage(): LogMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as LogMap) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

// Almacén compartido a nivel de módulo: todas las tarjetas/páginas leen y
// escriben el MISMO estado, y cada mutación persiste al instante. Antes cada
// componente tenía su propia copia y la escritura de uno pisaba la del otro
// (marcar dos sesiones en la misma página perdía la primera al recargar).
let state: LogMap = readStorage()
const listeners = new Set<() => void>()

function setState(next: LogMap) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage lleno o bloqueado: seguimos en memoria
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): LogMap {
  return state
}

export function useTrainingLog() {
  const log = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    setState({ ...state, [sessionId]: entry })
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    const existing = state[sessionId]
    setState({ ...state, [sessionId]: { ...existing, completed: !existing?.completed } })
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
