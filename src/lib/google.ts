import { useSyncExternalStore } from 'react'
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

let estado: Estado = { cargado: false, conexion: null, procesados: [] }
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
        .order('procesado_en', { ascending: false })
        .limit(10),
    ])
    // Si la consulta falla (sin red) se conserva lo que había: no es lo mismo que «desconectado».
    if (c.error) return
    poner({
      cargado: true,
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
    poner({ cargado: false, conexion: null, procesados: [] })
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
  void supabase.auth.getSession().then(({ data }) => alCambiarUsuario(data.session?.user.id ?? null))
  supabase.auth.onAuthStateChange((_e, s) => alCambiarUsuario(s?.user.id ?? null))
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

/** Texto en español para los errores que puede devolver el servidor. */
export function mensajeDeError(error?: string): string {
  if (error === 'falta_configuracion') {
    return 'El servidor aún no tiene las claves de Google. Hay que ponerlas en Supabase (mira docs/GOOGLE.md).'
  }
  if (error === 'reconectar') return 'Google pide volver a dar permiso. Toca «Reconectar».'
  return 'No se pudo completar. Inténtalo de nuevo en un momento.'
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
