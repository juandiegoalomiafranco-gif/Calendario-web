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
  /** Mensaje del primer store que esté fallando, si hay alguno. */
  lastError: string | null
  /** Cuántos stores fallan ahora mismo (de ~17). */
  failingStores: number
  /** Desde cuándo hay algún error sin resolver. */
  errorSince: number | null
}

let status: SyncStatus = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  signedIn: false,
  syncing: 0,
  pending: 0,
  lastSyncAt: null,
  lastError: null,
  failingStores: 0,
  errorSince: null,
}

const listeners = new Set<() => void>()
const pendingByStore = new Map<string, number>()

/**
 * El error se lleva POR STORE, no como una sola bandera global.
 *
 * Con una sola bandera, de los diecisiete stores bastaba que uno fallara para que
 * toda la app se pintara en rojo, y bastaba que otro acertara justo después para
 * borrar un error que seguía siendo real. El indicador quedaba parpadeando entre
 * «Al día» y «Error al sincronizar» según cuál respondiera de último.
 */
const errorByStore = new Map<string, string>()

function emit() {
  listeners.forEach((l) => l())
}

export function patchSyncStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  emit()
}

/** Recalcula el error visible a partir del mapa por store. */
function refrescarError() {
  const primero = errorByStore.values().next()
  if (primero.done) {
    patchSyncStatus({ lastError: null, failingStores: 0, errorSince: null })
    return
  }
  patchSyncStatus({
    lastError: primero.value,
    failingStores: errorByStore.size,
    // Se conserva el momento del primer fallo: así se distingue un bache de
    // treinta segundos de un problema que lleva rato sin resolverse.
    errorSince: status.errorSince ?? Date.now(),
  })
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

export function markSynced(storeKey: string) {
  const teniaError = errorByStore.delete(storeKey)
  patchSyncStatus({ lastSyncAt: Date.now() })
  if (teniaError) refrescarError()
}

export function markSyncError(storeKey: string, message: string) {
  if (errorByStore.get(storeKey) === message) return
  errorByStore.set(storeKey, message)
  refrescarError()
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

/**
 * Un celular pierde la red constantemente: al bloquear la pantalla, al cambiar de
 * wifi a datos, en el ascensor del colegio. Eso no es un error que haya que mirar,
 * y la app lo reintenta sola. Solo se pinta en rojo si lleva un rato sin poder.
 */
const UMBRAL_ALARMA_MS = 2 * 60_000

/** Etiqueta corta para el indicador de la barra superior. */
export function syncLabel(s: SyncStatus): { text: string; tone: 'ok' | 'warn' | 'muted' | 'danger' } {
  if (!s.signedIn) return { text: 'Solo en este dispositivo', tone: 'muted' }
  if (!s.online) return { text: 'Sin conexión', tone: 'muted' }
  if (s.lastError) {
    const llevaRato = s.errorSince != null && Date.now() - s.errorSince > UMBRAL_ALARMA_MS
    return llevaRato
      ? { text: 'Error al sincronizar', tone: 'danger' }
      : { text: 'Reintentando…', tone: 'warn' }
  }
  if (s.syncing > 0) return { text: 'Sincronizando…', tone: 'warn' }
  if (s.pending > 0) return { text: `${s.pending} sin subir`, tone: 'warn' }
  return { text: 'Al día', tone: 'ok' }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => patchSyncStatus({ online: true }))
  window.addEventListener('offline', () => patchSyncStatus({ online: false }))
}
