import { supabase } from './supabase'

/** Todo lo que guardamos lleva id y marca de última modificación. */
export interface Syncable {
  id: string
  updatedAt: string
}

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

interface StoreConfig<T extends Syncable, Row> {
  /** Llave en localStorage. */
  storageKey: string
  /** Tabla de Supabase. */
  table: string
  toRow: (item: T, userId: string) => Row
  fromRow: (row: Row) => T
}

/**
 * La cola guarda solo la operación y el id, no la fila: al enviar, el upsert se
 * construye desde la caché, así que siempre viaja el último estado del registro y
 * la cola no necesita saber el `user_id` en el momento de encolar. Eso es lo que
 * permite registrar movimientos antes de iniciar sesión sin perderlos.
 */
interface PendingWrite {
  kind: 'upsert' | 'delete'
  id: string
}

export interface SyncedStore<T extends Syncable> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => T[]
  getSyncState: () => SyncState
  /** Inserta o reemplaza un registro, poniéndole `updatedAt` al momento. */
  save: (item: Omit<T, 'updatedAt'> & { updatedAt?: string }) => void
  remove: (id: string) => void
  /** Reemplaza todo el contenido — lo usa la importación de respaldo. */
  replaceAll: (items: T[]) => void
  /** Trae del servidor y fusiona con lo local. */
  refresh: () => Promise<void>
  /** Vacía la caché local y la cola (al cerrar sesión). */
  clear: () => void
  setUserId: (userId: string | null) => void
}

export function createSyncedStore<T extends Syncable, Row extends { id: string }>(
  config: StoreConfig<T, Row>,
): SyncedStore<T> {
  const { storageKey, table, toRow, fromRow } = config
  const queueKey = `${storageKey}:queue`

  function readJson<V>(key: string, fallback: V): V {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as V) : fallback
    } catch {
      return fallback
    }
  }

  function writeJson(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Modo privado o sin espacio: al menos queda en memoria durante la sesión.
    }
  }

  let cache = new Map(readJson<T[]>(storageKey, []).map((i) => [i.id, i]))
  let snapshot: T[] = [...cache.values()]
  let queue = readJson<PendingWrite[]>(queueKey, [])
  let syncState: SyncState = 'idle'
  let userId: string | null = null
  const listeners = new Set<() => void>()

  function emit() {
    // useSyncExternalStore compara por identidad: el array se recrea solo aquí.
    snapshot = [...cache.values()]
    listeners.forEach((l) => l())
  }

  const writeCache = () => writeJson(storageKey, [...cache.values()])
  const writeQueue = () => writeJson(queueKey, queue)

  function setSyncState(next: SyncState) {
    if (syncState === next) return
    syncState = next
    listeners.forEach((l) => l())
  }

  function enqueue(write: PendingWrite) {
    // Una sola entrada pendiente por registro: la última operación gana.
    queue = queue.filter((w) => w.id !== write.id)
    queue.push(write)
    writeQueue()
  }

  async function flushQueue(): Promise<void> {
    if (!supabase || !userId || queue.length === 0) return
    setSyncState('saving')
    const failed: PendingWrite[] = []

    for (const write of [...queue]) {
      if (write.kind === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', write.id)
        if (error) failed.push(write)
        continue
      }
      const item = cache.get(write.id)
      // Se guardó y luego se borró antes de poder enviarlo: no hay nada que subir.
      if (!item) continue
      const { error } = await supabase.from(table).upsert(toRow(item, userId), { onConflict: 'id' })
      if (error) failed.push(write)
    }

    queue = failed
    writeQueue()
    setSyncState(failed.length === 0 ? 'saved' : 'offline')
  }

  async function refresh(): Promise<void> {
    if (!supabase || !userId) return
    // Primero se empuja lo pendiente: si no, la fusión compararía contra un
    // servidor que todavía no conoce los cambios locales.
    await flushQueue()

    const { data, error } = await supabase.from(table).select('*')
    if (error || !data) {
      setSyncState('offline')
      return
    }

    let changed = false
    const seen = new Set<string>()
    for (const row of data as Row[]) {
      const remote = fromRow(row)
      seen.add(remote.id)
      const local = cache.get(remote.id)
      // Gana el más reciente por registro; en empate, el servidor, que es la
      // fuente compartida entre dispositivos.
      if (!local || local.updatedAt <= remote.updatedAt) {
        cache.set(remote.id, remote)
        changed = true
      }
    }

    // Un registro local que el servidor no tiene y que tampoco está esperando en la
    // cola fue borrado desde otro dispositivo: se va también de aquí.
    const queuedIds = new Set(queue.map((w) => w.id))
    for (const id of [...cache.keys()]) {
      if (!seen.has(id) && !queuedIds.has(id)) {
        cache.delete(id)
        changed = true
      }
    }

    if (changed) {
      writeCache()
      emit()
    }
    setSyncState('saved')
  }

  function save(item: Omit<T, 'updatedAt'> & { updatedAt?: string }) {
    const next = { ...item, updatedAt: item.updatedAt ?? new Date().toISOString() } as T
    cache.set(next.id, next)
    writeCache()
    emit()
    // Se encola siempre, incluso sin sesión: al entrar, `setUserId` dispara el envío.
    enqueue({ kind: 'upsert', id: next.id })
    void flushQueue()
  }

  function remove(id: string) {
    const existed = cache.delete(id)
    writeCache()
    emit()
    if (existed) {
      enqueue({ kind: 'delete', id })
      void flushQueue()
    }
  }

  function replaceAll(items: T[]) {
    const removedIds = [...cache.keys()].filter((id) => !items.some((i) => i.id === id))
    cache = new Map(items.map((i) => [i.id, i]))
    writeCache()
    emit()
    for (const id of removedIds) enqueue({ kind: 'delete', id })
    for (const item of items) enqueue({ kind: 'upsert', id: item.id })
    void flushQueue()
  }

  function clear() {
    cache = new Map()
    queue = []
    writeCache()
    writeQueue()
    emit()
    setSyncState('idle')
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    getSyncState: () => syncState,
    save,
    remove,
    replaceAll,
    refresh,
    clear,
    setUserId(next) {
      if (next === userId) return
      const previous = userId
      userId = next
      // Al cerrar sesión se borra la caché para no mezclar datos entre cuentas.
      if (!next) {
        if (previous) clear()
        return
      }
      void refresh()
    },
  }
}

/** Mínimo que necesita el reintento: no depende del tipo de registro del store. */
type Refreshable = { refresh: () => Promise<void> }

/** Reintenta lo pendiente de todos los stores cuando vuelve la conexión. */
export function retryOnReconnect(stores: Refreshable[]) {
  if (typeof window === 'undefined') return
  window.addEventListener('online', () => {
    for (const store of stores) void store.refresh()
  })
}
