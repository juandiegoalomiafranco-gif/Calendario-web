import { type Admin, crearAdmin, identificar } from '../_shared/auth.ts'
import {
  accessTokenDe,
  type ConfigGoogle,
  DETALLE_FALTA_GOOGLE,
  ErrorReconectar,
  leerConfigGoogle,
  SCOPE_EVENTOS,
  SCOPE_GMAIL,
} from '../_shared/google.ts'
import { hoyEnBogota } from '../_shared/fechas.ts'
import { mensajeDe, preflight, responder } from '../_shared/http.ts'
import { type Conexion, enParalelo, idCalendarioPrincipal, leerConexiones, subirPendientes } from '../_shared/sync.ts'
import { type Correo, buscarCorreos, leerCorreo } from './correo.ts'
import { analizarCorreo, ErrorDetener, type Extraccion } from './claude.ts'

/**
 * Eventos importantes sacados de Gmail.
 *
 * Revisa los correos que Gmail marca como importantes, le pregunta a Claude si alguno
 * anuncia un evento y, si es claro e importante, lo crea solo (fuente `gmail`) y lo sube
 * a Google. Borrarlo en la app lo deshace. Cada correo queda en `gmail_procesados`, con
 * lo que se decidió, para no revisarlo (ni pagarlo) dos veces.
 *
 * - Con `x-cron-token` (pg_cron, cada 30 minutos): todos los que tienen Gmail activo.
 * - Con el JWT de un usuario («Sincronizar ahora»): solo ese.
 *
 * Responde {ok, revisados, eventos}.
 */

/** Tope por corrida: acota lo que se gasta en Claude si llega una avalancha de correos. */
const MAX_POR_CORRIDA = 20

const DETALLE_FALTA_ANTHROPIC =
  'Falta ANTHROPIC_API_KEY en Supabase → Edge Functions → Secrets (ver docs/GOOGLE.md).'

interface ResultadoGmail {
  revisados: number
  eventos: number
  /** Lo que detuvo la corrida por culpa de Anthropic y no del correo (null si nada). */
  problema: ErrorDetener | null
}

/** Cómo se le cuenta a la app un problema con Anthropic. */
function respuestaProblema(p: ErrorDetener): { error: string; detalle: string } {
  if (p.tipo === 'clave') {
    return { error: 'falta_configuracion', detalle: 'Anthropic rechazó la ANTHROPIC_API_KEY guardada (ver docs/GOOGLE.md).' }
  }
  if (p.tipo === 'credito') {
    return { error: 'sin_credito_anthropic', detalle: 'La cuenta de Anthropic no tiene saldo: hay que recargar en console.anthropic.com.' }
  }
  return { error: 'error_claude', detalle: p.message }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') return responder(req, { ok: false, error: 'metodo_no_permitido' }, 405)

  try {
    const admin = crearAdmin()
    const quien = await identificar(req, admin)
    if (!quien) return responder(req, { ok: false, error: 'no_autorizado' }, 401)

    const config = leerConfigGoogle()
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim()

    if (quien.tipo === 'cron') {
      // Sin claves no hay nada que hacer, y para el cron eso no es un error.
      if (!config || !apiKey) return responder(req, { ok: true, omitido: 'falta_configuracion' })
      const conexiones = (await leerConexiones(admin)).filter(puedeRevisar)
      const total = { revisados: 0, eventos: 0 }
      for (const conexion of conexiones) {
        try {
          const r = await revisarUsuario(admin, config, apiKey, conexion)
          total.revisados += r.revisados
          total.eventos += r.eventos
          // La clave y el saldo son los mismos para todos: no tiene sentido seguir.
          if (r.problema && r.problema.tipo !== 'transitorio') {
            console.error('gmail-scan cron detenido:', r.problema.tipo, r.problema.message)
            break
          }
        } catch (e) {
          if (!(e instanceof ErrorReconectar)) console.error('gmail-scan cron:', mensajeDe(e))
        }
      }
      return responder(req, { ok: true, usuarios: conexiones.length, ...total })
    }

    const [conexion] = await leerConexiones(admin, quien.userId)
    if (!conexion) return responder(req, { ok: false, error: 'no_conectado' })
    // Gmail apagado o sin permiso no es un fallo: simplemente no hay nada que revisar.
    if (!conexion.gmail_activo) return responder(req, { ok: true, revisados: 0, eventos: 0, omitido: 'gmail_apagado' })
    if (!(conexion.scopes ?? []).includes(SCOPE_GMAIL)) {
      return responder(req, { ok: true, revisados: 0, eventos: 0, omitido: 'sin_permiso_gmail' })
    }
    if (!config) return responder(req, { ok: false, error: 'falta_configuracion', detalle: DETALLE_FALTA_GOOGLE })
    if (!apiKey) return responder(req, { ok: false, error: 'falta_configuracion', detalle: DETALLE_FALTA_ANTHROPIC })

    try {
      const r = await revisarUsuario(admin, config, apiKey, conexion)
      // Saturación de Anthropic no es un fallo para el usuario: se reintenta solo.
      if (r.problema && r.problema.tipo !== 'transitorio') {
        console.error('gmail-scan usuario detenido:', r.problema.tipo, r.problema.message)
        return responder(req, { ok: false, ...respuestaProblema(r.problema), revisados: r.revisados, eventos: r.eventos })
      }
      return responder(req, { ok: true, revisados: r.revisados, eventos: r.eventos })
    } catch (e) {
      if (e instanceof ErrorReconectar) return responder(req, { ok: false, error: 'reconectar' })
      console.error('gmail-scan usuario:', mensajeDe(e))
      return responder(req, { ok: false, error: 'error_gmail', detalle: mensajeDe(e) })
    }
  } catch (e) {
    console.error('gmail-scan:', mensajeDe(e))
    return responder(req, { ok: false, error: 'error_interno', detalle: mensajeDe(e) }, 500)
  }
})

function puedeRevisar(c: Conexion): boolean {
  return c.gmail_activo && (c.scopes ?? []).includes(SCOPE_GMAIL)
}

/** Para comparar títulos sin que importen tildes, mayúsculas ni espacios. */
function normalizar(t: string): string {
  return t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function registrar(
  admin: Admin,
  userId: string,
  correo: Correo,
  decision: 'evento' | 'descartado' | 'error',
  motivo: string,
  eventId: string | null = null,
) {
  // ignoreDuplicates: si otra corrida ya lo registró, se queda lo primero que se decidió.
  const { error } = await admin.from('gmail_procesados').upsert(
    {
      user_id: userId,
      message_id: correo.id,
      decision,
      motivo: motivo.slice(0, 300),
      asunto: correo.asunto,
      remitente: correo.remitente,
      event_id: eventId,
    },
    { onConflict: 'user_id,message_id', ignoreDuplicates: true },
  )
  if (error) console.error('gmail-scan registrar:', error.message)
}

/** Aplica las reglas y, si pasa, crea el evento. Devuelve true si se creó. */
async function decidir(admin: Admin, userId: string, correo: Correo, ext: Extraccion, hoy: string): Promise<boolean> {
  let descarte: string | null = null
  if (!ext.es_evento) descarte = ext.motivo || 'No anuncia un evento.'
  else if (ext.importancia < 4) descarte = `Poco importante (${ext.importancia}/5). ${ext.motivo}`.trim()
  else if (!ext.fecha) descarte = 'No trae una fecha concreta.'
  else if (ext.fecha < hoy) descarte = 'La fecha ya pasó.'
  if (descarte || !ext.fecha) {
    await registrar(admin, userId, correo, 'descartado', descarte ?? 'No trae una fecha concreta.')
    return false
  }

  const titulo = ext.titulo || correo.asunto.slice(0, 120)

  /*
   * Si ya está (lo puso a mano, o salió de otro correo del mismo hilo), no se duplica.
   * Cuentan también los borrados: si lo quitaste, un recordatorio del mismo evento al
   * día siguiente no debe volver a ponerlo (borrar es deshacer).
   */
  const { data: mismoDia, error: errDia } = await admin
    .from('calendar_events')
    .select('id, title, deleted_at')
    .eq('user_id', userId)
    .eq('date', ext.fecha)
  if (errDia) throw new Error(errDia.message)
  const existente = (mismoDia ?? []).find((f) => normalizar(String(f.title ?? '')) === normalizar(titulo))
  if (existente) {
    const motivo = existente.deleted_at ? 'Ya lo habías quitado del calendario.' : 'Ya estaba en el calendario.'
    await registrar(admin, userId, correo, 'descartado', motivo, String(existente.id))
    return false
  }

  const id = crypto.randomUUID()
  const { error } = await admin.from('calendar_events').insert({
    id,
    user_id: userId,
    date: ext.fecha,
    title: titulo,
    type: ext.tipo,
    important: true,
    time: ext.hora,
    hora_fin: ext.hora ? ext.hora_fin : null,
    fecha_fin: ext.fecha_fin,
    lugar: ext.lugar,
    notes: `De: ${correo.remitente} · ${correo.asunto}\nhttps://mail.google.com/mail/u/0/#all/${correo.id}`,
    source: 'gmail',
    gmail_message_id: correo.id,
    // Lo escribe la service role, así que el trigger no lo marca: se marca aquí.
    google_pendiente: true,
  })
  if (error) throw new Error(error.message)

  await registrar(admin, userId, correo, 'evento', ext.motivo || 'Evento detectado.', id)
  return true
}

async function revisarUsuario(
  admin: Admin,
  config: ConfigGoogle,
  apiKey: string,
  conexion: Conexion,
): Promise<ResultadoGmail> {
  const userId = conexion.user_id
  const accessToken = await accessTokenDe(admin, config, userId)

  const ids = await buscarCorreos(accessToken)
  let nuevos: string[] = []
  if (ids.length > 0) {
    const { data, error } = await admin
      .from('gmail_procesados')
      .select('message_id')
      .eq('user_id', userId)
      .in('message_id', ids)
    if (error) throw new Error(error.message)
    const yaVistos = new Set((data ?? []).map((f) => String(f.message_id)))
    nuevos = ids.filter((id) => !yaVistos.has(id)).slice(0, MAX_POR_CORRIDA)
  }

  const hoy = hoyEnBogota()
  const resultado: ResultadoGmail = { revisados: 0, eventos: 0, problema: null }

  await enParalelo(nuevos, 3, async (id) => {
    // Con la clave mala, sin saldo o Anthropic saturado no se siguen gastando llamadas.
    if (resultado.problema) return
    let correo: Correo
    try {
      correo = await leerCorreo(accessToken, id)
    } catch (e) {
      // No se registra: se vuelve a intentar en la próxima corrida.
      console.error('gmail-scan leer correo:', mensajeDe(e))
      return
    }

    let extraccion: Extraccion
    try {
      extraccion = await analizarCorreo(apiKey, correo, hoy)
    } catch (e) {
      if (e instanceof ErrorDetener) {
        resultado.problema ??= e
        return
      }
      // Fallo propio de este correo (rechazo, respuesta cortada): se registra y no se repite.
      await registrar(admin, userId, correo, 'error', mensajeDe(e))
      resultado.revisados++
      return
    }

    resultado.revisados++
    try {
      if (await decidir(admin, userId, correo, extraccion, hoy)) resultado.eventos++
    } catch (e) {
      console.error('gmail-scan decidir:', mensajeDe(e))
    }
  })

  // Lo creado sube a Google en esta misma corrida, sin esperar al cron de sincronización.
  if (resultado.eventos > 0 && (conexion.scopes ?? []).includes(SCOPE_EVENTOS)) {
    try {
      await subirPendientes(admin, accessToken, userId, idCalendarioPrincipal(conexion.calendarios ?? [], conexion.email))
    } catch (e) {
      console.error('gmail-scan subir:', mensajeDe(e))
    }
  }

  await admin.from('google_conexion').update({ ultimo_gmail: new Date().toISOString() }).eq('user_id', userId)
  return resultado
}
