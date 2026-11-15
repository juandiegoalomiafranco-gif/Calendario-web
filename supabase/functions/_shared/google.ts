import type { Admin } from './auth.ts'

/**
 * Lo que hace falta para hablar con Google: configuración, tokens y un `fetch` con
 * reintentos. Sin SDK a propósito: son unas pocas llamadas REST y así la función arranca
 * rápido y no arrastra dependencias.
 */

export const SCOPE_EVENTOS = 'https://www.googleapis.com/auth/calendar.events'
export const SCOPE_CALENDARIOS = 'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
export const SCOPE_GMAIL = 'https://www.googleapis.com/auth/gmail.readonly'
export const SCOPES = ['openid', 'email', SCOPE_EVENTOS, SCOPE_CALENDARIOS, SCOPE_GMAIL]

/** Tiene que ser idéntica a la registrada en el cliente OAuth de Google Cloud. */
export const REDIRECT_URI = 'https://laabrbjtxugddlxtryou.supabase.co/functions/v1/google-auth'

export const API_CALENDARIO = 'https://www.googleapis.com/calendar/v3'
export const API_GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me'

export interface ConfigGoogle {
  clientId: string
  clientSecret: string
}

/** Null si el dueño todavía no puso los secretos en Supabase (ver docs/GOOGLE.md). */
export function leerConfigGoogle(): ConfigGoogle | null {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')?.trim()
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export const DETALLE_FALTA_GOOGLE =
  'Faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en Supabase → Edge Functions → Secrets (ver docs/GOOGLE.md).'

/** Google ya no acepta el refresh token (se revocó, caducó o se cambió la contraseña). */
export class ErrorReconectar extends Error {
  constructor() {
    super('reconectar')
  }
}

export interface RespuestaGoogle<T> {
  status: number
  ok: boolean
  datos: T | null
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

function razonDe(datos: unknown): string | undefined {
  return (datos as { error?: { errors?: { reason?: string }[] } } | null)?.error?.errors?.[0]?.reason
}

/** Errores que Google da por saturación y que se arreglan solos esperando un poco. */
function esReintentable(status: number, datos: unknown): boolean {
  if (status === 429 || status >= 500) return true
  if (status !== 403) return false
  const razon = razonDe(datos)
  return razon === 'rateLimitExceeded' || razon === 'userRateLimitExceeded'
}

/**
 * ¿Es un 403 (o 429) por límite de uso y no por falta de permiso? Google usa el mismo
 * 403 para «este calendario es de solo lectura» y para «vas muy rápido». Confundirlos
 * hacía que una edición se diera por imposible y se perdiera; un límite hay que tratarlo
 * como fallo pasajero, para que la fila siga pendiente y se reintente.
 */
export function esLimiteDeUso(r: RespuestaGoogle<unknown>): boolean {
  if (r.status === 429) return true
  if (r.status !== 403) return false
  const razon = razonDe(r.datos)
  return razon === 'rateLimitExceeded' || razon === 'userRateLimitExceeded' || razon === 'quotaExceeded' ||
    razon === 'dailyLimitExceeded'
}

/**
 * Una llamada a una API de Google. No lanza por códigos HTTP (cada sitio decide qué
 * hacer con un 404 o un 409); sí lanza si falla la red después de reintentar.
 */
export async function pedirGoogle<T = unknown>(
  accessToken: string,
  metodo: string,
  url: string,
  cuerpo?: unknown,
  cabeceras: Record<string, string> = {},
): Promise<RespuestaGoogle<T>> {
  let ultimoError: unknown = null
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await esperar(400 * 3 ** (intento - 1))
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...cabeceras,
        },
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      })
      const texto = await r.text()
      let datos: unknown = null
      if (texto) {
        try {
          datos = JSON.parse(texto)
        } catch {
          datos = null
        }
      }
      if (esReintentable(r.status, datos) && intento < 2) continue
      return { status: r.status, ok: r.ok, datos: datos as T | null }
    } catch (e) {
      ultimoError = e
    }
  }
  throw ultimoError instanceof Error ? ultimoError : new Error('fallo_de_red_google')
}

/** Mensaje corto de un error de Google, para logs y `ultimo_error`. */
export function errorDeGoogle(r: RespuestaGoogle<unknown>): string {
  const msg = (r.datos as { error?: { message?: string } | string } | null)?.error
  const texto = typeof msg === 'string' ? msg : msg?.message
  return `google_${r.status}${texto ? `: ${texto}` : ''}`.slice(0, 300)
}

interface RespuestaToken {
  access_token?: string
  refresh_token?: string
  scope?: string
  id_token?: string
  error?: string
  error_description?: string
}

async function pedirToken(parametros: Record<string, string>): Promise<RespuestaToken & { status: number }> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parametros),
  })
  let datos: RespuestaToken = {}
  try {
    datos = (await r.json()) as RespuestaToken
  } catch {
    datos = {}
  }
  return { ...datos, status: r.status }
}

/** Cambia el `code` de la vuelta de Google por los tokens. */
export async function canjearCodigo(config: ConfigGoogle, code: string) {
  const r = await pedirToken({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  })
  if (!r.access_token) throw new Error(`canje_fallido: ${r.error ?? r.status}`)
  return r
}

/** Un access token nuevo (dura ~1 h) a partir del refresh token guardado. */
export async function refrescarAccessToken(config: ConfigGoogle, refreshToken: string): Promise<string> {
  const r = await pedirToken({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  if (r.error === 'invalid_grant') throw new ErrorReconectar()
  if (!r.access_token) throw new Error(`refresco_fallido: ${r.error ?? r.status}`)
  return r.access_token
}

/** Revoca el permiso en Google. Si falla no pasa nada: el token se borra igual. */
export async function revocarToken(token: string): Promise<void> {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    })
  } catch {
    // Sin red no se puede revocar; el usuario puede quitar el acceso en su cuenta de Google.
  }
}

/** El email del id_token. Viene directo del endpoint de tokens por TLS: no hace falta verificar la firma. */
export function emailDelIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null
  try {
    const parte = idToken.split('.')[1]
    const json = atob(parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '='))
    const email = (JSON.parse(json) as { email?: unknown }).email
    return typeof email === 'string' ? email : null
  } catch {
    return null
  }
}

// --- Token guardado en Vault ---------------------------------------------------

export async function leerRefreshToken(admin: Admin, userId: string): Promise<string | null> {
  const { data, error } = await admin.rpc('google_leer_token', { p_user_id: userId })
  if (error) throw new Error(`leer_token: ${error.message}`)
  return typeof data === 'string' && data ? data : null
}

export async function guardarRefreshToken(admin: Admin, userId: string, token: string): Promise<void> {
  const { error } = await admin.rpc('google_guardar_token', { p_user_id: userId, p_token: token })
  if (error) throw new Error(`guardar_token: ${error.message}`)
}

export async function borrarRefreshToken(admin: Admin, userId: string): Promise<void> {
  const { error } = await admin.rpc('google_borrar_token', { p_user_id: userId })
  if (error) throw new Error(`borrar_token: ${error.message}`)
}

/**
 * Access token listo para usar. Si Google ya no acepta el permiso, lo deja anotado en
 * `ultimo_error = 'reconectar'` (la app enseña el botón «Reconectar») y lanza.
 */
export async function accessTokenDe(admin: Admin, config: ConfigGoogle, userId: string): Promise<string> {
  const refresh = await leerRefreshToken(admin, userId)
  try {
    if (!refresh) throw new ErrorReconectar()
    return await refrescarAccessToken(config, refresh)
  } catch (e) {
    if (e instanceof ErrorReconectar) {
      await admin.from('google_conexion').update({ ultimo_error: 'reconectar' }).eq('user_id', userId)
    }
    throw e
  }
}
