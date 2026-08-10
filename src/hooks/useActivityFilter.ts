import { useCallback, useSyncExternalStore } from 'react'
import { ACTIVITY_ORDER, type ActivityKey } from '../data/activityMeta'

const STORAGE_KEY = 'calendario-web:activity-filter:v1'

/**
 * Actividades ocultas en el calendario. Se guardan las ocultas (no las visibles)
 * para que cualquier familia nueva aparezca activada por defecto.
 * Store a nivel de módulo, igual que useSettings: la barra lateral y la página
 * de calendario comparten estado sin pasar props entre medio.
 */
function readStorage(): ActivityKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((k): k is ActivityKey => ACTIVITY_ORDER.includes(k as ActivityKey))
  } catch {
    return []
  }
}

let cache: ActivityKey[] = readStorage()
const listeners = new Set<() => void>()

function persist(next: ActivityKey[]) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // modo privado o sin espacio: el filtro sigue vivo en memoria
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useActivityFilter() {
  const hidden = useSyncExternalStore(subscribe, () => cache)

  const isVisible = useCallback((key: ActivityKey) => !hidden.includes(key), [hidden])

  const toggle = useCallback((key: ActivityKey) => {
    persist(cache.includes(key) ? cache.filter((k) => k !== key) : [...cache, key])
  }, [])

  const showAll = useCallback(() => persist([]), [])

  return { hidden, isVisible, toggle, showAll, allVisible: hidden.length === 0 }
}
