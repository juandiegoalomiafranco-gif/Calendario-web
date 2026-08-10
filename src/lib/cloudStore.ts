/**
 * Store compartido con caché local y sincronización con Supabase.
 *
 * Este bloque (caché en localStorage + store de módulo + recarga al entrar +
 * limpieza al salir) estaba copiado y pegado en cada hook. Aquí vive una sola
 * vez, así añadir una sección nueva es escribir solo su `load` y su `push`.
 *
 * La escritura en la nube la hace cada hook, porque cada uno sube algo distinto
 * (una fila, un mapa completo, una lista).
 */
import { isSupabaseConfigured, supabase } from './supabase'
import { setSyncState } from './syncStatus'

interface Options<T> {
  storageKey: string
  initial: T
  /** Normaliza lo que venga de localStorage (formatos viejos incluidos). */
  hydrate?: (raw: unknown) => T
  /**
   * Lee el estado del usuario y lo **fusiona** con lo que ya hay en el
   * dispositivo. Recibe la caché actual justamente para no pisarla: devolver la
   * respuesta de la nube tal cual borraría lo que se registró sin conexión.
   * `null` = no hay nada o falló: se conserva la caché.
   */
  load: (userId: string, local: T) => Promise<T | null>
}

export interface CloudStore<T> {
  subscribe(listener: () => void): () => void
  snapshot(): T
  /** Guarda en la caché local y avisa a los suscriptores (escritura optimista). */
  setLocal(next: T): void
  userId(): string | null
  /** Resuelve cuando terminó el primer intento de carga desde la nube. */
  ready: Promise<void>
}

export function createCloudStore<T>(options: Options<T>): CloudStore<T> {
  function readStorage(): T {
    try {
      const raw = localStorage.getItem(options.storageKey)
      if (!raw) return options.initial
      const parsed: unknown = JSON.parse(raw)
      return options.hydrate ? options.hydrate(parsed) : (parsed as T)
    } catch {
      return options.initial
    }
  }

  let cache = readStorage()
  let currentUserId: string | null = null
  const listeners = new Set<() => void>()

  function setLocal(next: T) {
    cache = next
    try {
      localStorage.setItem(options.storageKey, JSON.stringify(next))
    } catch {
      // sin espacio o modo privado: al menos queda en memoria
    }
    listeners.forEach((listener) => listener())
  }

  async function loadRemote() {
    if (!currentUserId) {
      setSyncState('local')
      return
    }
    setSyncState('sincronizando')
    try {
      const merged = await options.load(currentUserId, cache)
      if (merged !== null) setLocal(merged)
      setSyncState(merged === null ? 'sin-conexion' : 'sincronizado')
    } catch (error) {
      setSyncState('sin-conexion', error instanceof Error ? error.message : String(error))
    }
  }

  // Cargar al entrar y limpiar al salir, para no mezclar datos entre usuarios.
  const ready = isSupabaseConfigured
    ? supabase.auth.getSession().then(async ({ data }) => {
        currentUserId = data.session?.user.id ?? null
        await loadRemote()
      })
    : Promise.resolve()

  if (isSupabaseConfigured) {
    supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user.id ?? null
      if (nextId === currentUserId) return
      currentUserId = nextId
      if (nextId) void loadRemote()
      else setLocal(options.initial)
    })
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    snapshot: () => cache,
    setLocal,
    userId: () => currentUserId,
    ready,
  }
}

/** Marca el resultado de una escritura en la nube en el estado de sincronización. */
export function reportWrite(error: { message: string } | null, what: string) {
  if (error) {
    console.error(`No se pudo guardar ${what}:`, error.message)
    setSyncState('sin-conexion', error.message)
  } else {
    setSyncState('sincronizado')
  }
}
