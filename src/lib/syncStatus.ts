import { useSyncExternalStore } from 'react'

/**
 * Estado de la sincronización con la nube, compartido por todos los stores.
 *
 * Antes, si Supabase fallaba solo quedaba un `console.error`: la app seguía como
 * si nada y no había forma de saber que lo registrado estaba únicamente en este
 * dispositivo.
 */
export type SyncState =
  /** Sin sesión: todo se guarda solo aquí. */
  | 'local'
  | 'sincronizando'
  | 'sincronizado'
  /** Hubo un fallo de red o de la base: los datos están a salvo en el dispositivo. */
  | 'sin-conexion'

let state: SyncState = 'local'
let lastError: string | null = null
const listeners = new Set<() => void>()

export function setSyncState(next: SyncState, error?: string) {
  if (next === state && (error ?? null) === lastError) return
  state = next
  lastError = error ?? null
  listeners.forEach((l) => l())
}

export function getSyncState(): SyncState {
  return state
}

export function getSyncError(): string | null {
  return lastError
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSyncStatus(): { state: SyncState; error: string | null } {
  const current = useSyncExternalStore(subscribe, getSyncState, getSyncState)
  return { state: current, error: lastError }
}
