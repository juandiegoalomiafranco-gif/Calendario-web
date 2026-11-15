import { useSyncExternalStore } from 'react'
import { trasPrimerPintado } from './arranque'
import { supabase } from './supabase'

/*
 * Estado de la cuenta de Google vinculada. Vive fuera de React porque lo necesitan dos
 * sitios que no se conocen: Ajustes (para mostrarlo) y la hoja de un evento (para avisar
 * de que borrarlo también lo borra en Google). El servidor es quien habla con Google;
 * aquí solo se lee la tabla y se invocan las Edge Functions.
 */

export interface GoogleCalendario {
  id: string
  nombre: string
  color?: string
  principal: boolean
  visible: boolean
}

export interface GoogleConexion {
  email: string | null
  scopes: string[]
  calendarios: GoogleCalendario[]
  ultimaSync: string | null
  /** 'reconectar' cuando Google rechazó el permiso guardado. */
  ultimoError: string | null
}

interface Estado {
  cargado: boolean
  /**
   * La última lectura falló (sin red al abrir). Con `cargado` en true igual: si no, el
   * botón «Conectar» se quedaba apagado sin explicación hasta volver a la pestaña.
   */
  errorCarga: boolean
  conexion: GoogleConexion | null
}

interface FilaConexion {
  email: string | null
  scopes: string[] | null
  calendarios: GoogleCalendario[] | null
  ultima_sync: string | null
  ultimo_error: string | null
}

let estado: Estado = { cargado: false, errorCarga: false, conexion: null }
const oyentes = new Set<() => void>()
let userId: string | null = null
let canal: ReturnType<typeof supabase.channel> | null = null

function poner(siguiente: Partial<Estado>) {
  estado = { ...estado, ...siguiente }
  oyentes.forEach((o) => o())
}

export function useGoogleEstado(): Estado {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => {
        oyentes.delete(o)
      }
    },
    () => estado,
  )
}

function aConexion(f: FilaConexion): GoogleConexion {
  return {
    email: f.email,
    scopes: f.scopes ?? [],
    calendarios: f.calendarios ?? [],
    ultimaSync: f.ultima_sync,
    ultimoError: f.ultimo_error,
  }
}

/** Vuelve a leer la conexión. Nunca lanza. */
export async function recargarGoogle(): Promise<void> {
  if (!userId) return
  try {
    const c = await supabase.from('google_conexion').select('*').maybeSingle()
    // Si la consulta falla (sin red) se conserva lo que había: no es lo mismo que «desconectado».
    if (c.error) {
      poner({ cargado: true, errorCarga: true })
      return
    }
    poner({
      cargado: true,
      errorCarga: false,
      conexion: c.data ? aConexion(c.data as FilaConexion) : null,
    })
  } catch (e) {
    console.warn('[google] no se pudo leer la conexión', e)
    poner({ cargado: true, errorCarga: true })
  }
}

function alCambiarUsuario(id: string | null) {
  if (id === userId) return
  userId = id
  if (canal) {
    void supabase.removeChannel(canal)
    canal = null
  }
  if (!id) {
    poner({ cargado: false, errorCarga: false, conexion: null })
    return
  }
  void recargarGoogle()
  // El servidor actualiza la fila (última sync, error, calendarios) sin que la app lo
  // pida: con realtime Ajustes se pone al día solo. Si el canal se cae, al volver a la
  // pestaña se vuelve a leer.
  canal = supabase
    .channel(`mivida-google-${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'google_conexion', filter: `user_id=eq.${id}` },
      () => void recargarGoogle(),
    )
    .subscribe()
}

if (typeof window !== 'undefined') {
  // Ni la conexión con Google ni su canal hacen falta para pintar la primera pantalla.
  trasPrimerPintado(() => {
    void supabase.auth.getSession().then(({ data }) => alCambiarUsuario(data.session?.user.id ?? null))
    supabase.auth.onAuthStateChange((_e, s) => alCambiarUsuario(s?.user.id ?? null))
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void recargarGoogle()
  })
}

// --- Llamadas a las Edge Functions ------------------------------------------

export interface RespuestaFuncion {
  ok: boolean
  error?: string
  [clave: string]: unknown
}

/**
 * Invoca una función y devuelve siempre un objeto. Con un error HTTP, supabase-js entrega
 * el cuerpo dentro de `error.context` (un Response): se intenta leer para no perder el
 * `{ok:false, error:'falta_configuracion'}` que manda el servidor.
 */
export async function llamarFuncion(
  nombre: 'google-auth' | 'google-sync',
  cuerpo?: Record<string, unknown>,
): Promise<RespuestaFuncion> {
  try {
    const { data, error } = await supabase.functions.invoke(nombre, cuerpo ? { body: cuerpo } : {})
    if (error) {
      const ctx = (error as { context?: unknown }).context
      if (ctx instanceof Response) {
        try {
          const j = (await ctx.json()) as RespuestaFuncion
          if (j && typeof j === 'object') return { ...j, ok: false }
        } catch {
          // El cuerpo no era JSON: se cae al mensaje genérico.
        }
      }
      return { ok: false, error: error.message }
    }
    return (data ?? { ok: true }) as RespuestaFuncion
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fallo_de_red' }
  }
}

/** Lo que significa cada código de error de las funciones de Google. */
const MENSAJES_ERROR: Record<string, string> = {
  no_autorizado: 'Tu sesión caducó. Vuelve a entrar con tu código e inténtalo otra vez.',
  no_permitido: 'Esta cuenta de MyLife no tiene permiso para conectar Google: solo la del dueño.',
  falta_configuracion:
    'El servidor aún no tiene las claves de Google. Hay que ponerlas en Supabase (mira docs/GOOGLE.md).',
  reconectar: 'Google pide volver a dar permiso. Toca «Reconectar».',
  no_conectado: 'Google no está conectado.',
  volver_a_no_permitido: 'Esta dirección de la app no puede conectar Google. Ábrela desde la dirección normal.',
  error_sync: 'No se pudo sincronizar con Google. Inténtalo otra vez en un rato; si no, se reintenta solo el lunes.',
}

/**
 * Texto en español para un error del servidor. Si el servidor mandó `detalle`, se añade:
 * es lo que dice qué falta exactamente (por ejemplo, qué secreto).
 */
export function mensajeDeError(error?: string, detalle?: unknown): string {
  const base = (error && MENSAJES_ERROR[error]) || 'No se pudo completar. Inténtalo de nuevo en un momento.'
  return typeof detalle === 'string' && detalle.trim() ? `${base} (${detalle.trim()})` : base
}

/** Lo que significa cada `motivo` con el que vuelve la conexión con Google. */
const MOTIVOS_VUELTA: Record<string, string> = {
  cancelado: 'Cancelaste el permiso en Google.',
  no_permitido: 'Esta cuenta de MyLife no tiene permiso para conectar Google: solo la del dueño.',
  estado_invalido: 'El enlace de vuelta no es válido o ya se usó. Empieza otra vez desde «Conectar».',
  caducado: 'Pasaron más de 10 minutos. Empieza otra vez desde «Conectar».',
  sin_permiso_calendario: 'Hace falta dejar marcado el permiso del calendario.',
  sin_refresh_token: 'Google no dio un permiso duradero. Quita el acceso de MyLife en tu cuenta de Google y conecta otra vez.',
  falta_configuracion: 'El servidor aún no tiene las claves de Google (mira docs/GOOGLE.md).',
  canje_fallido: 'Google no aceptó el código de vuelta. Inténtalo de nuevo.',
  sin_codigo: 'Google no devolvió el permiso. Inténtalo de nuevo.',
  google: 'Google devolvió un error.',
  servidor: 'Falló el servidor al guardar la conexión.',
}

/** Texto para el `motivo` de `#/ajustes?google=error&motivo=…`. */
export function mensajeDeMotivo(motivo: string | null): string {
  const texto = (motivo && MOTIVOS_VUELTA[motivo]) || 'Inténtalo de nuevo.'
  return `No se pudo conectar con Google. ${texto}`
}
