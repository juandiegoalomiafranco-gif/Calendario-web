import { useSyncExternalStore } from 'react'

/**
 * Estado de la sincronización, compartido por toda la app. Existe para que un fallo
 * al guardar deje de ser invisible: antes solo se hacía `console.error` y por eso la
 * app pudo pasar meses sin subir un solo dato sin que nadie lo notara.
 */
export interface SyncStatus {
  online: boolean
  signedIn: boolean
  /** Cuántos stores están hablando con la nube ahora mismo. */
  syncing: number
  /** Cambios locales que todavía no han subido. */
  pending: number
  lastSyncAt: number | null
  lastError: string | null
}

let status: SyncStatus = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  signedIn: false,
  syncing: 0,
  pending: 0,
  lastSyncAt: null,
  lastError: null,
}

const listeners = new Set<() => void>()
const pendingByStore = new Map<string, number>()

function emit() {
  listeners.forEach((l) => l())
}

export function patchSyncStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  emit()
}

/** Cada store informa cuántos cambios suyos faltan por subir. */
export function reportPending(storeKey: string, count: number) {
  if (count === 0) pendingByStore.delete(storeKey)
  else pendingByStore.set(storeKey, count)
  let total = 0
  for (const n of pendingByStore.values()) total += n
  if (total !== status.pending) patchSyncStatus({ pending: total })
}

export function markSyncing(delta: 1 | -1) {
  patchSyncStatus({ syncing: Math.max(0, status.syncing + delta) })
}

export function markSynced() {
  patchSyncStatus({ lastSyncAt: Date.now(), lastError: null })
}

export function markSyncError(message: string) {
  patchSyncStatus({ lastError: message })
}

export function getSyncStatus(): SyncStatus {
  return status
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => status, () => status)
}

/** Etiqueta corta para el indicador de la barra superior. */
export function syncLabel(s: SyncStatus): { text: string; tone: 'ok' | 'warn' | 'muted' | 'danger' } {
  if (!s.signedIn) return { text: 'Solo en este dispositivo', tone: 'muted' }
  if (!s.online) return { text: 'Sin conexión', tone: 'muted' }
  if (s.lastError) return { text: 'Error al sincronizar', tone: 'danger' }
  if (s.syncing > 0) return { text: 'Sincronizando…', tone: 'warn' }
  if (s.pending > 0) return { text: `${s.pending} sin subir`, tone: 'warn' }
  return { text: 'Al día', tone: 'ok' }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => patchSyncStatus({ online: true }))
  window.addEventListener('offline', () => patchSyncStatus({ online: false }))
}
