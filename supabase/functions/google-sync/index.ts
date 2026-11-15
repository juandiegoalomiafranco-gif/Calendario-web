import { crearAdmin, estaPermitido, identificar } from '../_shared/auth.ts'
import { DETALLE_FALTA_GOOGLE, ErrorReconectar, leerConfigGoogle } from '../_shared/google.ts'
import { mensajeDe, preflight, responder } from '../_shared/http.ts'
import { leerConexiones, sincronizarUsuario } from '../_shared/sync.ts'

/**
 * Sincroniza la app con Google Calendar en los dos sentidos.
 *
 * - Con `x-cron-token` (pg_cron, cada 5 minutos): todos los usuarios conectados.
 * - Con el JWT de un usuario (la app, unos segundos después de cada cambio): solo ese.
 *
 * Responde {ok, subidos, bajados, borrados} o {ok:false, error}. Los errores lógicos
 * van con 200 para que `supabase.functions.invoke` entregue el cuerpo tal cual.
 */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') return responder(req, { ok: false, error: 'metodo_no_permitido' }, 405)

  try {
    const admin = crearAdmin()
    const quien = await identificar(req, admin)
    if (!quien) return responder(req, { ok: false, error: 'no_autorizado' }, 401)
    // Solo el dueño usa Google; el cron ya se salta a los demás (leerConexiones).
    if (quien.tipo === 'usuario' && !(await estaPermitido(admin, quien.userId))) {
      return responder(req, { ok: false, error: 'no_permitido' }, 403)
    }

    const config = leerConfigGoogle()
    if (!config) {
      // Para el cron no es un error: el dueño todavía no configuró Google.
      if (quien.tipo === 'cron') return responder(req, { ok: true, omitido: 'falta_configuracion' })
      return responder(req, { ok: false, error: 'falta_configuracion', detalle: DETALLE_FALTA_GOOGLE })
    }

    const conexiones = await leerConexiones(admin, quien.tipo === 'usuario' ? quien.userId : undefined)

    if (quien.tipo === 'usuario') {
      if (conexiones.length === 0) return responder(req, { ok: false, error: 'no_conectado' })
      try {
        const r = await sincronizarUsuario(admin, config, conexiones[0])
        return responder(req, { ok: true, ...r })
      } catch (e) {
        if (e instanceof ErrorReconectar) return responder(req, { ok: false, error: 'reconectar' })
        console.error('google-sync usuario:', mensajeDe(e))
        return responder(req, { ok: false, error: 'error_sync', detalle: mensajeDe(e) })
      }
    }

    // Cron: un usuario que falla no frena a los demás.
    const total = { subidos: 0, bajados: 0, borrados: 0 }
    let fallidos = 0
    for (const conexion of conexiones) {
      try {
        const r = await sincronizarUsuario(admin, config, conexion)
        total.subidos += r.subidos
        total.bajados += r.bajados
        total.borrados += r.borrados
      } catch (e) {
        fallidos++
        if (!(e instanceof ErrorReconectar)) console.error('google-sync cron:', mensajeDe(e))
      }
    }
    return responder(req, { ok: true, usuarios: conexiones.length, fallidos, ...total })
  } catch (e) {
    console.error('google-sync:', mensajeDe(e))
    return responder(req, { ok: false, error: 'error_interno', detalle: mensajeDe(e) }, 500)
  }
})
