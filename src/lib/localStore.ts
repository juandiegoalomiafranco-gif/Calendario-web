import { useSyncExternalStore } from 'react'

/**
 * Store compartido a nivel de módulo respaldado en localStorage. Todas las instancias
 * del hook ven el mismo valor, así una lista y su detalle no se pisan. Mismo patrón que
 * useTrainingLog, generalizado para reutilizar en los nuevos módulos. Cuando migremos a
 * Supabase, solo se cambia la implementación de `set`/`read` aquí y en los hooks.
 */
export function createLocalStore<T>(key: string, initial: T) {
  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  }

  let cache: T = read()
  const listeners = new Set<() => void>()

  function set(next: T) {
    cache = next
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // sin espacio o modo privado: al menos mantenemos el estado en memoria
    }
    listeners.forEach((l) => l())
  }

  function update(fn: (prev: T) => T) {
    set(fn(cache))
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, () => cache, () => cache)
  }

  return { get: () => cache, set, update, useStore }
}
