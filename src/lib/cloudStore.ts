import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import {
  markSyncError,
  markSynced,
  markSyncing,
  patchSyncStatus,
  reportPending,
} from './syncStatus'

/**
 * Stores respaldados en Supabase con caché local, pensados para UNA persona en DOS
 * dispositivos (celular y computador) que tienen que verse siempre iguales.
 *
 * La versión anterior leía de la nube una sola vez al arrancar y después solo escribía,
 * así que un cambio hecho en el celular nunca llegaba al computador ya abierto, y un
 * cambio hecho sin señal se perdía para siempre. Esta versión resuelve las tres cosas:
 *
 *  1. BAJADA INCREMENTAL — se guarda un cursor `updated_at` y solo se pide lo que cambió.
 *  2. REALTIME — Supabase avisa de los cambios del otro dispositivo y se aplican solos.
 *  3. COLA DE SALIDA — cada cambio local se persiste antes de intentar subirlo y se
 *     reintenta al volver la conexión, al volver a la pestaña y cada 30 s.
 *
 * Conflictos: gana el último en escribir, medido con el `updated_at` que pone el
 * servidor (un solo reloj). Mientras un cambio propio siga en la cola, no se pisa con
 * lo que baje de la nube.
 *
 * Borrados: son SUAVES (`deleted_at`). Sin eso, borrar algo en el celular mientras el
 * computador está sin señal hacía que el dato «resucitara» al reconectar.
 */

// --- Sesión compartida -------------------------------------------------------

type Loader = (userId: string | null) => void

const loaders = new Set<Loader>()
const realtimeHandlers = new Map<string, (row: Record<string, unknown>) => void>()
let currentUserId: string | null = null
let channel: ReturnType<typeof supabase.channel> | null = null

function registerLoader(loader: Loader) {
  loaders.add(loader)
  if (currentUserId) loader(currentUserId)
}

let reconexion: ReturnType<typeof setTimeout> | null = null
let intentosRealtime = 0

/**
 * El canal de Realtime se cae solo, y en el celular se cae todo el rato: al bloquear
 * la pantalla iOS suspende el WebSocket, y al cambiar de wifi a datos se corta. Antes
 * `subscribe()` iba sin callback, así que nadie se enteraba de la caída y el canal se
 * quedaba muerto: el celular dejaba de recibir lo del computador hasta recargar.
 */
function startRealtime(userId: string) {
  stopRealtime()
  const ch = supabase.channel(`mivida-sync-${userId}`)
  for (const table of realtimeHandlers.keys()) {
    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Record<string, unknown> | null
        if (row && Object.keys(row).length > 0) realtimeHandlers.get(table)?.(row)
      },
    )
  }
  channel = ch
  ch.subscribe((estado) => {
    // Si ya lo reemplazamos o lo cerramos a propósito, su estado ya no nos importa.
    if (channel !== ch) return
    if (estado === 'SUBSCRIBED') {
      intentosRealtime = 0
      // Mientras estuvo caído pudimos perdernos cambios del otro dispositivo:
      // una bajada completa nos pone al día.
      schedulePull()
    } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') {
      programarReconexion(userId)
    }
  })
}

function programarReconexion(userId: string) {
  if (reconexion) return
  intentosRealtime++
  // 2 s, 4 s, 8 s… hasta un minuto, para no castigar la batería ni la red.
  const espera = Math.min(2_000 * 2 ** (intentosRealtime - 1), 60_000)
  reconexion = setTimeout(() => {
    reconexion = null
    if (currentUserId === userId) startRealtime(userId)
  }, espera)
}

function stopRealtime() {
  if (reconexion) {
    clearTimeout(reconexion)
    reconexion = null
  }
  if (channel) {
    const ch = channel
    channel = null // antes de quitarlo, para que su CLOSED no dispare reconexión
    void supabase.removeChannel(ch)
  }
}

function onUser(userId: string | null) {
  if (userId === currentUserId) return
  currentUserId = userId
  patchSyncStatus({ signedIn: !!userId })
  loaders.forEach((l) => l(userId))
  if (userId) startRealtime(userId)
  else stopRealtime()
}

void supabase.auth.getSession().then(({ data }) => onUser(data.session?.user.id ?? null))
supabase.auth.onAuthStateChange((_event, session) => onUser(session?.user.id ?? null))

/**
 * Id único para items nuevos. Las columnas son `uuid` en Postgres, así que el id
 * tiene que ser un UUID de verdad: uno cualquiera haría fallar el insert entero.
 */
export function newId(): string {
  const c: Crypto | undefined = typeof crypto === 'undefined' ? undefined : crypto
  if (c?.randomUUID) return c.randomUUID()
  // Respaldo UUID v4 (navegadores viejos o contextos no seguros).
  const b = new Uint8Array(16)
  if (c?.getRandomValues) c.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sin espacio o modo privado: al menos mantenemos el estado en memoria
  }
}

// --- Programación de reintentos ---------------------------------------------

/** `forzar` salta el guardado de espera y la comprobación de `navigator.onLine`. */
const flushers = new Set<(forzar: boolean) => void>()
const pullers = new Set<(forzar: boolean) => void>()

function scheduleFlush(forzar = false) {
  flushers.forEach((f) => f(forzar))
}

function schedulePull(forzar = false) {
  pullers.forEach((p) => p(forzar))
}

/**
 * Fuerza una sincronización completa (botón «Sincronizar ahora» y reconexiones).
 *
 * Va forzada a propósito: en iOS `navigator.onLine` miente y a veces se queda en
 * `false` con la red funcionando. Si el botón respetara esa bandera, el usuario
 * tocaría «Sincronizar ahora» y no pasaría absolutamente nada.
 */
export function syncNow() {
  schedulePull(true)
  scheduleFlush(true)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncNow)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow()
  })

  // Subir lo que quede en la cola, a menudo y barato (no hace nada si está vacía).
  setInterval(() => {
    if (currentUserId) scheduleFlush()
  }, 20_000)

  // Bajar cada minuto. Es la red de seguridad para cuando Realtime está caído:
  // sin esto, un canal muerto dejaba el dispositivo desactualizado indefinidamente.
  setInterval(() => {
    if (currentUserId && document.visibilityState === 'visible') schedulePull()
  }, 60_000)
}

interface RowMeta {
  id: string
  updated_at?: string | null
  deleted_at?: string | null
}

// --- Colección: un array de items identificados por `id` ---------------------

interface CollectionOpts<T, Row> {
  /** Clave de caché en localStorage. */
  key: string
  /** Tabla de Supabase. */
  table: string
  rowToItem: (row: Row) => T
  itemToRow: (item: T, userId: string) => Record<string, unknown>
}

export interface Collection<T> {
  useAll: () => T[]
  get: () => T[]
  upsert: (item: T) => void
  remove: (id: string) => void
}

export function createCollection<T extends { id: string }, Row>(
  opts: CollectionOpts<T, Row>,
): Collection<T> {
  const cursorKey = `${opts.key}:cursor`
  const outboxKey = `${opts.key}:outbox`

  let cache: T[] = readJSON<T[]>(opts.key, [])
  let cursor: string | null = readJSON<string | null>(cursorKey, null)
  /** id → item pendiente de subir (con `deleted` para los borrados). */
  const outbox = new Map<string, { item: T; deleted: boolean }>(
    readJSON<[string, { item: T; deleted: boolean }][]>(outboxKey, []),
  )
  const listeners = new Set<() => void>()
  let flushing = false

  /** Reintento con espera creciente, para no machacar la red cuando algo falla. */
  let fallos = 0
  let proximoIntento = 0

  function anotarFallo(mensaje: string) {
    fallos++
    proximoIntento = Date.now() + Math.min(10_000 * 2 ** (fallos - 1), 5 * 60_000)
    markSyncError(opts.key, mensaje)
  }

  function anotarExito() {
    fallos = 0
    proximoIntento = 0
    markSynced(opts.key)
  }

  /** ¿Toca esperar todavía? Un intento forzado (botón, reconexión) nunca espera. */
  function enEspera(forzar: boolean) {
    return !forzar && Date.now() < proximoIntento
  }

  function saveOutbox() {
    writeJSON(outboxKey, [...outbox.entries()])
    reportPending(opts.key, outbox.size)
  }

  function persistLocal(next: T[]) {
    cache = next
    writeJSON(opts.key, next)
    listeners.forEach((l) => l())
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  /** Aplica filas venidas de la nube sin pisar lo que aún tenemos en la cola. */
  function applyRows(rows: (Row & RowMeta)[]) {
    if (rows.length === 0) return
    const next = [...cache]
    let changed = false
    for (const row of rows) {
      if (row.updated_at && (!cursor || row.updated_at > cursor)) cursor = row.updated_at
      if (outbox.has(row.id)) continue // nuestro cambio pendiente manda
      const idx = next.findIndex((x) => x.id === row.id)
      if (row.deleted_at) {
        if (idx >= 0) {
          next.splice(idx, 1)
          changed = true
        }
      } else {
        const item = opts.rowToItem(row)
        if (idx >= 0) next[idx] = item
        else next.push(item)
        changed = true
      }
    }
    writeJSON(cursorKey, cursor)
    if (changed) persistLocal(next)
  }

  async function pull(forzar = false) {
    if (!currentUserId || enEspera(forzar)) return
    markSyncing(1)
    try {
      let q = supabase.from(opts.table).select('*')
      // Sin cursor es la primera vez: no hace falta traerse las lápidas.
      q = cursor ? q.gt('updated_at', cursor) : q.is('deleted_at', null)
      const { data, error } = await q
      if (error) {
        anotarFallo(error.message)
        return
      }
      applyRows((data ?? []) as (Row & RowMeta)[])
      anotarExito()
    } catch (e) {
      // Un fallo de red lanza en vez de devolver `error`, y sin este catch la
      // promesa quedaba rechazada sin que nadie lo registrara.
      anotarFallo(e instanceof Error ? e.message : 'Fallo de red al bajar datos')
    } finally {
      markSyncing(-1)
    }
  }

  async function flush(forzar = false) {
    if (flushing || !currentUserId || outbox.size === 0) return
    if (enEspera(forzar)) return
    if (!forzar && !navigator.onLine) return
    flushing = true
    markSyncing(1)
    try {
      const batch = [...outbox.entries()]
      const rows = batch.map(([, { item, deleted }]) => ({
        ...opts.itemToRow(item, currentUserId as string),
        deleted_at: deleted ? new Date().toISOString() : null,
      }))
      const { error } = await supabase.from(opts.table).upsert(rows, { onConflict: 'id' })
      if (error) {
        anotarFallo(error.message)
        return
      }
      // Solo se sacan de la cola los que se enviaron: lo escrito entretanto se queda.
      for (const [id, entry] of batch) {
        if (outbox.get(id) === entry) outbox.delete(id)
      }
      saveOutbox()
      anotarExito()
    } catch (e) {
      anotarFallo(e instanceof Error ? e.message : 'Fallo de red al subir datos')
    } finally {
      flushing = false
      markSyncing(-1)
    }
  }

  function enqueue(item: T, deleted: boolean) {
    outbox.set(item.id, { item, deleted })
    saveOutbox()
    void flush()
  }

  flushers.add((forzar) => void flush(forzar))
  pullers.add((forzar) => void pull(forzar))

  realtimeHandlers.set(opts.table, (row) => applyRows([row as Row & RowMeta]))

  registerLoader((userId) => {
    if (!userId) return
    // Primera vez con este esquema: lo que ya había en el dispositivo se sube.
    // Reemplaza a la vieja «migración de una sola vez», que con dos dispositivos
    // podía pisar datos.
    if (cursor === null && cache.length > 0 && outbox.size === 0) {
      for (const item of cache) outbox.set(item.id, { item, deleted: false })
      saveOutbox()
    }
    void pull().then(() => flush())
  })

  reportPending(opts.key, outbox.size)

  return {
    useAll: () => useSyncExternalStore(subscribe, () => cache, () => cache),
    get: () => cache,
    upsert(item) {
      const exists = cache.some((x) => x.id === item.id)
      persistLocal(exists ? cache.map((x) => (x.id === item.id ? item : x)) : [...cache, item])
      enqueue(item, false)
    },
    remove(id) {
      const item = cache.find((x) => x.id === id)
      persistLocal(cache.filter((x) => x.id !== id))
      if (item) enqueue(item, true)
    },
  }
}

// --- Singleton: una sola fila por usuario (p. ej. configuración) --------------

interface SingletonOpts<T, Row> {
  key: string
  table: string
  fallback: T
  rowToValue: (row: Row) => T
  valueToRow: (value: T, userId: string) => Record<string, unknown>
}

export interface Singleton<T> {
  useValue: () => T
  get: () => T
  set: (value: T) => void
  update: (fn: (prev: T) => T) => void
}

export function createSingleton<T, Row>(opts: SingletonOpts<T, Row>): Singleton<T> {
  const dirtyKey = `${opts.key}:dirty`

  let cache: T = readJSON<T>(opts.key, opts.fallback)
  let dirty: boolean = readJSON<boolean>(dirtyKey, false)
  let lastUpdatedAt: string | null = null
  const listeners = new Set<() => void>()
  let flushing = false

  function persistLocal(next: T) {
    cache = next
    writeJSON(opts.key, next)
    listeners.forEach((l) => l())
  }

  function setDirty(value: boolean) {
    dirty = value
    writeJSON(dirtyKey, value)
    reportPending(opts.key, value ? 1 : 0)
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function applyRow(row: Row & { updated_at?: string | null }) {
    if (dirty) return // lo nuestro todavía no ha subido: no lo pisamos
    lastUpdatedAt = row.updated_at ?? lastUpdatedAt
    persistLocal(opts.rowToValue(row))
  }

  let fallos = 0
  let proximoIntento = 0

  function anotarFallo(mensaje: string) {
    fallos++
    proximoIntento = Date.now() + Math.min(10_000 * 2 ** (fallos - 1), 5 * 60_000)
    markSyncError(opts.key, mensaje)
  }

  function anotarExito() {
    fallos = 0
    proximoIntento = 0
    markSynced(opts.key)
  }

  function enEspera(forzar: boolean) {
    return !forzar && Date.now() < proximoIntento
  }

  async function pull(forzar = false) {
    if (!currentUserId || enEspera(forzar)) return
    markSyncing(1)
    try {
      const { data, error } = await supabase
        .from(opts.table)
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) {
        anotarFallo(error.message)
        return
      }
      if (data) applyRow(data as Row & { updated_at?: string | null })
      else setDirty(true) // aún no hay fila: la creamos con lo que haya en local
      anotarExito()
    } catch (e) {
      anotarFallo(e instanceof Error ? e.message : 'Fallo de red al bajar datos')
    } finally {
      markSyncing(-1)
    }
  }

  async function flush(forzar = false) {
    if (flushing || !dirty || !currentUserId) return
    if (enEspera(forzar)) return
    if (!forzar && !navigator.onLine) return
    flushing = true
    markSyncing(1)
    try {
      const { error } = await supabase
        .from(opts.table)
        .upsert(opts.valueToRow(cache, currentUserId), { onConflict: 'user_id' })
      if (error) {
        anotarFallo(error.message)
        return
      }
      setDirty(false)
      anotarExito()
    } catch (e) {
      anotarFallo(e instanceof Error ? e.message : 'Fallo de red al subir datos')
    } finally {
      flushing = false
      markSyncing(-1)
    }
  }

  flushers.add((forzar) => void flush(forzar))
  pullers.add((forzar) => void pull(forzar))
  realtimeHandlers.set(opts.table, (row) =>
    applyRow(row as Row & { updated_at?: string | null }),
  )

  registerLoader((userId) => {
    if (!userId) return
    void pull().then(() => flush())
  })

  reportPending(opts.key, dirty ? 1 : 0)

  function set(value: T) {
    persistLocal(value)
    setDirty(true)
    void flush()
  }

  return {
    useValue: () => useSyncExternalStore(subscribe, () => cache, () => cache),
    get: () => cache,
    set,
    update: (fn) => set(fn(cache)),
  }
}
