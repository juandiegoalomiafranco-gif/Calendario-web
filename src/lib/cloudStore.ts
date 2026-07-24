import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'

/**
 * Infraestructura reutilizable para stores respaldados en Supabase con caché en
 * localStorage. Generaliza el patrón de `useTrainingLog`: carga instantánea y lectura
 * offline desde la caché local, y sincronización con la nube cuando hay sesión (la
 * sesión anónima de `supabase.ts`). Pensado para reutilizarse en las fases siguientes
 * (nutrición, finanzas, etc.), no solo en Colegio.
 *
 * Diseño de seguridad de datos:
 * - Nunca borra la caché local al arrancar sin sesión (evita perder datos antes de que
 *   la sesión anónima se establezca).
 * - Migración única local -> nube: si la nube está vacía pero hay datos locales, los
 *   sube una sola vez (marca `${key}:synced`). Después, la nube es la fuente de verdad.
 */

type Loader = (userId: string | null) => void

const loaders = new Set<Loader>()
let currentUserId: string | null = null

function registerLoader(loader: Loader) {
  loaders.add(loader)
  // Si la sesión ya está lista (store importado tarde), carga de inmediato.
  if (currentUserId) loader(currentUserId)
}

void supabase.auth.getSession().then(({ data }) => {
  currentUserId = data.session?.user.id ?? null
  loaders.forEach((l) => l(currentUserId))
})

supabase.auth.onAuthStateChange((_event, session) => {
  const next = session?.user.id ?? null
  if (next === currentUserId) return
  currentUserId = next
  loaders.forEach((l) => l(next))
})

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
  let cache: T[] = readJSON<T[]>(opts.key, [])
  const listeners = new Set<() => void>()
  const syncedKey = `${opts.key}:synced`

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

  async function load(userId: string | null) {
    if (!userId) return // sin sesión: conservamos la caché local
    const { data, error } = await supabase.from(opts.table).select('*')
    if (error || !data) return // offline/error: conservamos la caché local
    const cloud = (data as Row[]).map(opts.rowToItem)
    if (cloud.length === 0 && cache.length > 0 && !localStorage.getItem(syncedKey)) {
      // Migración única: subimos la caché local a la nube la primera vez.
      void supabase
        .from(opts.table)
        .upsert(cache.map((it) => opts.itemToRow(it, userId)), { onConflict: 'id' })
      localStorage.setItem(syncedKey, '1')
      return // la caché local ya es la fuente
    }
    localStorage.setItem(syncedKey, '1')
    persistLocal(cloud)
  }

  registerLoader(load)

  return {
    useAll: () => useSyncExternalStore(subscribe, () => cache, () => cache),
    get: () => cache,
    upsert(item) {
      const exists = cache.some((x) => x.id === item.id)
      persistLocal(exists ? cache.map((x) => (x.id === item.id ? item : x)) : [...cache, item])
      if (!currentUserId) return
      void supabase
        .from(opts.table)
        .upsert(opts.itemToRow(item, currentUserId), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error(`No se pudo guardar en ${opts.table}:`, error.message)
        })
    },
    remove(id) {
      persistLocal(cache.filter((x) => x.id !== id))
      if (!currentUserId) return
      void supabase
        .from(opts.table)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error(`No se pudo borrar de ${opts.table}:`, error.message)
        })
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
  let cache: T = readJSON<T>(opts.key, opts.fallback)
  const listeners = new Set<() => void>()

  function persistLocal(next: T) {
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

  function pushToCloud(value: T, userId: string) {
    void supabase
      .from(opts.table)
      .upsert(opts.valueToRow(value, userId), { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.error(`No se pudo guardar ${opts.table}:`, error.message)
      })
  }

  async function load(userId: string | null) {
    if (!userId) return // conservamos la caché local; no reseteamos al fallback
    const { data, error } = await supabase.from(opts.table).select('*').limit(1).maybeSingle()
    if (error) return
    if (data) {
      persistLocal(opts.rowToValue(data as Row))
      return
    }
    // Aún no hay fila: la creamos con la configuración local actual (migra ancla/overrides).
    pushToCloud(cache, userId)
  }

  registerLoader(load)

  function set(value: T) {
    persistLocal(value)
    if (currentUserId) pushToCloud(value, currentUserId)
  }

  return {
    useValue: () => useSyncExternalStore(subscribe, () => cache, () => cache),
    get: () => cache,
    set,
    update: (fn) => set(fn(cache)),
  }
}
