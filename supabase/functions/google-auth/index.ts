import { type Admin, crearAdmin, estaPermitido, usuarioDelJwt } from '../_shared/auth.ts'
import {
  borrarRefreshToken,
  canjearCodigo,
  DETALLE_FALTA_GOOGLE,
  emailDelIdToken,
  guardarRefreshToken,
  leerConfigGoogle,
  leerRefreshToken,
  REDIRECT_URI,
  revocarToken,
  SCOPE_EVENTOS,
  SCOPES,
} from '../_shared/google.ts'
import { hoyEnBogota } from '../_shared/fechas.ts'
import { leerCuerpo, mensajeDe, preflight, responder, VOLVER_POR_DEFECTO, volverAValido } from '../_shared/http.ts'
import { type Calendario, listarCalendarios, sincronizarUsuario } from '../_shared/sync.ts'

/**
 * Vincular y desvincular la cuenta de Google.
 *
 * El login de la app sigue siendo el código; Google es una cuenta aparte que se conecta
 * con OAuth hecho aquí, en el servidor, para que el refresh token nunca pase por el
 * navegador:
 *
 * - POST {accion:'iniciar', volver_a} con el JWT → {ok, url} de consentimiento de Google.
 * - GET ?code&state → Google vuelve aquí; se guardan los tokens y se redirige a la app.
 * - POST {accion:'desconectar'} con el JWT → revoca y borra todo lo de Google.
 */

declare const EdgeRuntime: { waitUntil(promesa: Promise<unknown>): void } | undefined

const VIDA_ESTADO_MS = 10 * 60 * 1000

/** Nonce aleatorio de 256 bits en base64url, para el `state` de OAuth. */
function nonceAleatorio(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight(req)
  const admin = crearAdmin()
  if (req.method === 'GET') return await volverDeGoogle(req, admin)
  if (req.method !== 'POST') return responder(req, { ok: false, error: 'metodo_no_permitido' }, 405)

  try {
    const userId = await usuarioDelJwt(req, admin)
    if (!userId) return responder(req, { ok: false, error: 'no_autorizado' }, 401)

    const cuerpo = await leerCuerpo(req)
    if (cuerpo.accion === 'iniciar') {
      // Solo el dueño vincula Google (ver estaPermitido). Desconectar sí lo puede hacer
      // cualquiera: solo borra lo suyo.
      if (!(await estaPermitido(admin, userId))) {
        return responder(req, { ok: false, error: 'no_permitido' }, 403)
      }
      return await iniciar(req, admin, userId, cuerpo.volver_a)
    }
    if (cuerpo.accion === 'desconectar') return await desconectar(req, admin, userId)
    return responder(req, { ok: false, error: 'accion_desconocida' }, 400)
  } catch (e) {
    console.error('google-auth:', mensajeDe(e))
    return responder(req, { ok: false, error: 'error_interno', detalle: mensajeDe(e) }, 500)
  }
})

async function iniciar(req: Request, admin: Admin, userId: string, volverA: unknown): Promise<Response> {
  const config = leerConfigGoogle()
  if (!config) {
    return responder(req, { ok: false, error: 'falta_configuracion', detalle: DETALLE_FALTA_GOOGLE })
  }

  const destino = volverAValido(volverA)
  if (!destino) return responder(req, { ok: false, error: 'volver_a_no_permitido' }, 400)

  // De paso se limpian los intentos que nunca volvieron.
  await admin.from('google_oauth_estados').delete().lt('expira', new Date().toISOString())

  const nonce = nonceAleatorio()
  const { error } = await admin.from('google_oauth_estados').insert({
    nonce,
    user_id: userId,
    volver_a: destino,
    expira: new Date(Date.now() + VIDA_ESTADO_MS).toISOString(),
  })
  if (error) throw new Error(error.message)

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    // offline + consent: sin esto Google no siempre manda refresh token, y sin refresh
    // token no se puede sincronizar cuando la app está cerrada.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: nonce,
  }).toString()

  return responder(req, { ok: true, url: url.toString() })
}

/** La vuelta de Google. Siempre termina en una redirección a la app, nunca en un error crudo. */
async function volverDeGoogle(req: Request, admin: Admin): Promise<Response> {
  const params = new URL(req.url).searchParams
  let destino = VOLVER_POR_DEFECTO

  const redirigir = (resultado: 'conectado' | 'error', motivo?: string) =>
    new Response(null, {
      status: 302,
      headers: {
        Location: `${destino}#/ajustes?google=${resultado}${motivo ? `&motivo=${encodeURIComponent(motivo)}` : ''}`,
        'Cache-Control': 'no-store',
      },
    })

  try {
    const state = params.get('state')
    if (!state) return redirigir('error', 'estado_invalido')

    // Un solo uso: se borra al leerlo, así una URL de vuelta repetida no sirve dos veces.
    const { data: estado, error: errEstado } = await admin
      .from('google_oauth_estados')
      .delete()
      .eq('nonce', state)
      .select('user_id, volver_a, expira')
      .maybeSingle()
    if (errEstado || !estado) return redirigir('error', 'estado_invalido')

    destino = volverAValido(estado.volver_a) ?? VOLVER_POR_DEFECTO
    if (new Date(estado.expira).getTime() < Date.now()) return redirigir('error', 'caducado')
    // Se vuelve a mirar aquí: el permiso pudo retirarse entre iniciar y volver.
    if (!(await estaPermitido(admin, estado.user_id as string))) return redirigir('error', 'no_permitido')

    const errorGoogle = params.get('error')
    if (errorGoogle) return redirigir('error', errorGoogle === 'access_denied' ? 'cancelado' : 'google')

    const code = params.get('code')
    if (!code) return redirigir('error', 'sin_codigo')

    const config = leerConfigGoogle()
    if (!config) return redirigir('error', 'falta_configuracion')

    const userId = estado.user_id as string
    let tokens: Awaited<ReturnType<typeof canjearCodigo>>
    try {
      tokens = await canjearCodigo(config, code)
    } catch (e) {
      console.error('google-auth canje:', mensajeDe(e))
      return redirigir('error', 'canje_fallido')
    }

    const scopes = (tokens.scope ?? '').split(' ').filter(Boolean)
    // Google deja desmarcar permisos. Sin el del calendario no hay nada que sincronizar.
    if (!scopes.includes(SCOPE_EVENTOS)) {
      await revocarToken(tokens.refresh_token ?? tokens.access_token!)
      return redirigir('error', 'sin_permiso_calendario')
    }

    if (tokens.refresh_token) {
      await guardarRefreshToken(admin, userId, tokens.refresh_token)
    } else if (!(await leerRefreshToken(admin, userId))) {
      return redirigir('error', 'sin_refresh_token')
    }

    let email = emailDelIdToken(tokens.id_token)
    if (!email) {
      try {
        const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        if (r.ok) email = ((await r.json()) as { email?: string }).email ?? null
      } catch {
        // Sin email se sigue igual: solo se usa para mostrarlo en Ajustes.
      }
    }

    const { data: previa } = await admin
      .from('google_conexion')
      .select('calendarios')
      .eq('user_id', userId)
      .maybeSingle()
    const calendarios = await listarCalendarios(
      tokens.access_token!,
      (previa?.calendarios ?? []) as Calendario[],
      email,
    )

    const { data: conexion, error: errConexion } = await admin
      .from('google_conexion')
      .upsert(
        {
          user_id: userId,
          email,
          scopes,
          calendarios,
          ultimo_error: null,
          conectado_en: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select('user_id, email, scopes, calendarios')
      .single()
    if (errConexion || !conexion) throw new Error(errConexion?.message ?? 'sin_conexion')

    await marcarParaSubir(admin, userId)

    // La primera sincronización corre después de redirigir: puede tardar varios segundos
    // y no hay por qué dejar al usuario mirando una pantalla en blanco.
    const primera = sincronizarUsuario(admin, config, conexion).catch((e) =>
      console.error('google-auth primera sync:', mensajeDe(e))
    )
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(primera)
    else await primera

    return redirigir('conectado')
  } catch (e) {
    console.error('google-auth vuelta:', mensajeDe(e))
    return redirigir('error', 'servidor')
  }
}

/**
 * Al conectar se suben los eventos propios de hoy en adelante. Las marcas de pendiente
 * que quedaron de antes en eventos pasados (la base marca cada cambio de la app, haya o
 * no Google) se quitan, para no llenar Google de eventos viejos. Las de los borrados se
 * dejan: si ese evento llegó a Google en una conexión anterior, la subida lo borra allá
 * (por su id fijo); si no, Google responde que no existe y no pasa nada.
 */
async function marcarParaSubir(admin: Admin, userId: string) {
  const hoy = hoyEnBogota()
  const { error: e1 } = await admin
    .from('calendar_events')
    .update({ google_pendiente: false, google_cambios: [] })
    .eq('user_id', userId)
    .eq('google_pendiente', true)
    .is('google_event_id', null)
    .is('deleted_at', null)
    .lt('date', hoy)
  if (e1) throw new Error(e1.message)

  // Si se desconectó y se vuelve a conectar, vuelven a Google con el mismo id, así que no
  // se duplican si allá seguían.
  const { error: e2 } = await admin
    .from('calendar_events')
    .update({ google_pendiente: true })
    .eq('user_id', userId)
    .eq('source', 'propio')
    .gte('date', hoy)
    .is('deleted_at', null)
    .is('google_event_id', null)
  if (e2) throw new Error(e2.message)
}

async function desconectar(req: Request, admin: Admin, userId: string): Promise<Response> {
  const token = await leerRefreshToken(admin, userId)
  if (token) await revocarToken(token)
  await borrarRefreshToken(admin, userId)

  const { error: e1 } = await admin.from('google_conexion').delete().eq('user_id', userId)
  if (e1) throw new Error(e1.message)

  const ahora = new Date().toISOString()

  // Lo que vino de Google se borra en la app. Conserva su id de Google (con el etag vacío)
  // para que, si se vuelve a conectar la misma cuenta, reaparezca en vez de duplicarse.
  const { error: e2 } = await admin
    .from('calendar_events')
    .update({ deleted_at: ahora, google_etag: null, google_pendiente: false, google_cambios: [] })
    .eq('user_id', userId)
    .eq('source', 'google')
    .is('deleted_at', null)
  if (e2) throw new Error(e2.message)

  const { error: e3 } = await admin
    .from('calendar_events')
    .update({ google_pendiente: false, google_cambios: [] })
    .eq('user_id', userId)
    .eq('source', 'google')
    .eq('google_pendiente', true)
  if (e3) throw new Error(e3.message)

  // Lo demás se queda en la app, pero sin enlace con Google.
  const sinEnlace = { google_event_id: null, google_calendar_id: null, google_etag: null, google_link: null }
  const { error: e4 } = await admin
    .from('calendar_events')
    .update({ ...sinEnlace, google_pendiente: false, google_cambios: [] })
    .eq('user_id', userId)
    .neq('source', 'google')
    .is('deleted_at', null)
    .or('google_event_id.not.is.null,google_pendiente.eq.true')
  if (e4) throw new Error(e4.message)

  // Un borrado que no alcanzó a subir sigue pendiente: al reconectar se borra en Google
  // por su id fijo, en vez de quedar vivo allá y volver a aparecer en la app.
  const { error: e5 } = await admin
    .from('calendar_events')
    .update(sinEnlace)
    .eq('user_id', userId)
    .neq('source', 'google')
    .not('deleted_at', 'is', null)
    .not('google_event_id', 'is', null)
  if (e5) throw new Error(e5.message)

  return responder(req, { ok: true })
}
