import { useSyncExternalStore } from 'react'
import { trasPrimerPintado } from './arranque'
import { supabase } from './supabase'

/*
 * Estado de la cuenta de Google vinculada. Vive fuera de React porque lo necesitan dos
 * sitios que no se conocen: Ajustes (para mostrarlo) y el calendario (para saber si hay
 * que pedir una sincronización tras cada cambio). El servidor es quien habla con Google;
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
  gmailActivo: boolean
  ultimaSync: string | null
  ultimoGmail: string | null
  /** 'reconectar' cuando Google rechazó el permiso guardado. */
  ultimoError: string | null
}

export interface GmailProcesado {
  messageId: string
  procesadoEn: string
  decision: 'evento' | 'descartado' | 'error'
  motivo: string | null
  asunto: string | null
  remitente: string | null
}

interface Estado {
  cargado: boolean
  /**
   * La última lectura falló (sin red al abrir). Con `cargado` en true igual: si no, el
   * botón «Conectar» se quedaba apagado sin explicación hasta volver a la pestaña.
   */
  errorCarga: boolean
  conexion: GoogleConexion | null
  procesados: GmailProcesado[]
}

interface FilaConexion {
  email: string | null
  scopes: string[] | null
  calendarios: GoogleCalendario[] | null
  gmail_activo: boolean | null
  ultima_sync: string | null
  ultimo_gmail: string | null
  ultimo_error: string | null
}

interface FilaProcesado {
  message_id: string
  procesado_en: string
  decision: string
  motivo: string | null
  asunto: string | null
  remitente: string | null
}

let estado: Estado = { cargado: false, errorCarga: false, conexion: null, procesados: [] }
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

/** ¿Hay una cuenta de Google conectada? Lo consulta el calendario fuera de React. */
export function googleConectado(): boolean {
  return estado.conexion != null
}

function aConexion(f: FilaConexion): GoogleConexion {
  return {
    email: f.email,
    scopes: f.scopes ?? [],
    calendarios: f.calendarios ?? [],
    gmailActivo: f.gmail_activo ?? true,
    ultimaSync: f.ultima_sync,
    ultimoGmail: f.ultimo_gmail,
    ultimoError: f.ultimo_error,
  }
}

/** Vuelve a leer la conexión y los últimos correos revisados. Nunca lanza. */
export async function recargarGoogle(): Promise<void> {
  if (!userId) return
  try {
    const [c, p] = await Promise.all([
      supabase.from('google_conexion').select('*').maybeSingle(),
      supabase
        .from('gmail_procesados')
        .select('message_id, procesado_en, decision, motivo, asunto, remitente')
        // «procesando» es la reserva mientras Claude lo lee; aún no hay nada que enseñar.
        .neq('decision', 'procesando')
        .order('procesado_en', { ascending: false })
        .limit(10),
    ])
    // Si la consulta falla (sin red) se conserva lo que había: no es lo mismo que «desconectado».
    if (c.error) {
      poner({ cargado: true, errorCarga: true })
      return
    }
    poner({
      cargado: true,
      errorCarga: false,
      conexion: c.data ? aConexion(c.data as FilaConexion) : null,
      procesados: ((p.data ?? []) as FilaProcesado[]).map((r) => ({
        messageId: r.message_id,
        procesadoEn: r.procesado_en,
        decision: (['evento', 'descartado', 'error'].includes(r.decision)
          ? r.decision
          : 'error') as GmailProcesado['decision'],
        motivo: r.motivo,
        asunto: r.asunto,
        remitente: r.remitente,
      })),
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
    poner({ cargado: false, errorCarga: false, conexion: null, procesados: [] })
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
  nombre: 'google-auth' | 'google-sync' | 'gmail-scan',
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
  falta_clave_anthropic:
    'Falta (o no sirve) la clave de Anthropic para revisar Gmail. El calendario sigue funcionando (mira docs/GOOGLE.md).',
  sin_credito_anthropic:
    'La cuenta de Anthropic se quedó sin saldo, así que no se revisó Gmail. El calendario sigue funcionando.',
  reconectar: 'Google pide volver a dar permiso. Toca «Reconectar».',
  no_conectado: 'Google no está conectado.',
  volver_a_no_permitido: 'Esta dirección de la app no puede conectar Google. Ábrela desde la dirección normal.',
  error_sync: 'No se pudo sincronizar con Google. Se reintenta solo en unos minutos.',
  error_gmail: 'No se pudo revisar Gmail. Se reintenta solo en un rato.',
  error_claude: 'Claude no pudo revisar los correos. Se reintenta solo en un rato.',
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

// --- Sincronización tras editar ---------------------------------------------

let temporizador: ReturnType<typeof setTimeout> | null = null

/**
 * Pide una sincronización con Google ~4 s después del último cambio: si se editan
 * varios eventos seguidos se junta todo en una sola llamada. No bloquea nada y los
 * errores solo se registran; el cron del servidor lo reintenta cada 5 minutos.
 */
export function pedirSyncGoogle() {
  if (!googleConectado()) return
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    temporizador = null
    void llamarFuncion('google-sync').then((r) => {
      if (!r.ok) console.warn('[google] sync tras editar falló:', r.error)
    })
  }, 4_000)
}
