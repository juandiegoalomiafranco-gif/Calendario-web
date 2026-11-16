import { type Admin, idsPermitidos } from './auth.ts'
import {
  accessTokenDe,
  API_CALENDARIO,
  type ConfigGoogle,
  ErrorReconectar,
  errorDeGoogle,
  esLimiteDeUso,
  pedirGoogle,
} from './google.ts'
import {
  desdeGoogle,
  type FechasLocales,
  haciaGoogle,
  hoyEnBogota,
  htmlATexto,
  medianocheBogota,
  type MomentoGoogle,
  sumarDias,
} from './fechas.ts'
import { mensajeDe } from './http.ts'

/**
 * Sincronización entre `calendar_events` y Google Calendar.
 *
 * Una corrida: refresca el token → actualiza la lista de calendarios → sube lo que la app
 * dejó pendiente → baja lo que cambió en Google. Subir antes de bajar hace que un cambio
 * hecho en la app no lo pise la versión vieja que todavía tiene Google.
 *
 * Puede correr dos veces a la vez (el cron de los lunes, «Sincronizar ahora» o la primera
 * sincronización al conectar), así que todo está pensado para que eso no duplique ni
 * pierda nada:
 * - al crear en Google se usa un id fijo derivado del id local: el segundo intento recibe
 *   un 409 en vez de crear un duplicado;
 * - cada escritura en la base va condicionada a `updated_at`: si la app tocó la fila
 *   mientras tanto, no se pisa su cambio;
 * - el índice único (usuario, calendario, evento) impide dos filas para un mismo evento.
 */

export interface Calendario {
  id: string
  nombre: string
  color?: string
  principal: boolean
  visible: boolean
}

export interface Conexion {
  user_id: string
  email: string | null
  scopes: string[] | null
  calendarios: Calendario[] | null
}

export interface FilaEvento extends FechasLocales {
  id: string
  user_id: string
  title: string
  type: string
  important: boolean
  notes: string | null
  source: string
  updated_at: string
  deleted_at: string | null
  lugar: string | null
  google_event_id: string | null
  google_calendar_id: string | null
  google_etag: string | null
  google_link: string | null
  google_pendiente: boolean
  /** Campos que la app cambió desde la última subida (los anota el trigger de la base). */
  google_cambios: string[] | null
}

export const COLUMNAS_EVENTO =
  'id, user_id, date, title, type, important, time, notes, source, updated_at, deleted_at, ' +
  'fecha_fin, hora_fin, lugar, google_event_id, google_calendar_id, google_etag, google_link, ' +
  'google_pendiente, google_cambios'

interface EventoGoogle {
  id: string
  etag?: string
  status?: string
  summary?: string
  description?: string
  location?: string
  start?: MomentoGoogle
  end?: MomentoGoogle
  updated?: string
  htmlLink?: string
  eventType?: string
  extendedProperties?: { private?: Record<string, string> }
}

export interface ResultadoSync {
  subidos: number
  bajados: number
  borrados: number
}

/** Lo del colegio viene sembrado del calendario oficial y no se sube nunca. */
const FUENTES_QUE_SUBEN = new Set(['propio', 'google'])

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Lo que se escribe cuando una fila ya no tiene nada por subir. */
const SIN_PENDIENTES = { google_pendiente: false, google_cambios: [] as string[] }

/** Si cambia alguno de estos, hay que mandar el inicio y el fin. */
const CAMPOS_DE_FECHA = ['date', 'time', 'hora_fin', 'fecha_fin']

// --- Utilidades ------------------------------------------------------------------

/** Corre `fn` sobre `items` con a lo sumo `n` a la vez (Google limita por usuario). */
export async function enParalelo<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
  let siguiente = 0
  const trabajadores = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (siguiente < items.length) await fn(items[siguiente++])
  })
  await Promise.all(trabajadores)
}

type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/** PostgREST corta en 1000 filas: se lee por páginas hasta el final. */
async function leerTodas<T>(consulta: (desde: number, hasta: number) => Pagina<T>): Promise<T[]> {
  const todas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consulta(desde, desde + 999)
    if (error) throw new Error(error.message)
    todas.push(...(data ?? []))
    if (!data || data.length < 1000) return todas
  }
}

function trozos<T>(items: T[], tamano: number): T[][] {
  const r: T[][] = []
  for (let i = 0; i < items.length; i += tamano) r.push(items.slice(i, i + tamano))
  return r
}

const ahora = () => new Date().toISOString()

function urlEvento(calendarId: string, eventId: string): string {
  return `${API_CALENDARIO}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
}

/**
 * Id de Google fijo para una fila local: Google acepta ids propios en base32hex
 * (0-9 y a-v) y un UUID sin guiones ya lo es. Así un reintento no crea un duplicado.
 */
export function idGoogleDe(idLocal: string): string | null {
  const id = idLocal.toLowerCase().replace(/-/g, '')
  return /^[0-9a-v]{5,1024}$/.test(id) ? id : null
}

/** La descripción de Google puede venir en HTML; las notas de la app son texto plano. */
function notasDesdeGoogle(descripcion: string | undefined): string | null {
  if (!descripcion) return null
  const texto = /<[a-z][\s\S]*>/i.test(descripcion) ? htmlATexto(descripcion) : descripcion.trim()
  return texto ? texto.slice(0, 5000) : null
}

/** El id del calendario principal tal como queda en `google_calendar_id`. */
export function idCalendarioPrincipal(calendarios: Calendario[], email: string | null): string {
  return calendarios.find((c) => c.principal)?.id ?? email ?? 'primary'
}

/** El evento completo, para crearlo (o revivirlo) en Google. */
function cuerpoCompleto(fila: FilaEvento, paraPatch: boolean): Record<string, unknown> {
  const { start, end } = haciaGoogle(fila, paraPatch)
  const cuerpo: Record<string, unknown> = {
    summary: fila.title?.trim() || '(Sin título)',
    start,
    end,
    // Marca el evento como nuestro: al bajarlo se reconoce aunque no se haya alcanzado
    // a guardar su id de Google.
    extendedProperties: { private: { mylifeId: fila.id } },
  }
  if (paraPatch) {
    // En un patch, '' borra el campo en Google; null lo dejaría como estaba.
    cuerpo.description = fila.notes ?? ''
    cuerpo.location = fila.lugar ?? ''
  } else {
    if (fila.notes) cuerpo.description = fila.notes
    if (fila.lugar) cuerpo.location = fila.lugar
  }
  return cuerpo
}

/**
 * Solo lo que la app cambió (según `google_cambios`). Mandar el evento entero reescribía
 * en Google cosas que nadie tocó: la descripción en HTML quedaba en texto plano y
 * recortada, un vuelo en hora de Madrid pasaba a hora de Bogotá, una instancia de una
 * serie se separaba de ella. Devuelve {} si no hay nada que mandar.
 */
export function cuerpoParcial(fila: FilaEvento): Record<string, unknown> {
  const campos = new Set(fila.google_cambios ?? [])
  const cuerpo: Record<string, unknown> = {}
  if (campos.has('title')) cuerpo.summary = fila.title?.trim() || '(Sin título)'
  if (campos.has('notes')) cuerpo.description = fila.notes ?? ''
  if (campos.has('lugar')) cuerpo.location = fila.lugar ?? ''
  if (CAMPOS_DE_FECHA.some((c) => campos.has(c))) {
    const { start, end } = haciaGoogle(fila, true)
    cuerpo.start = start
    cuerpo.end = end
  }
  return cuerpo
}

function columnasDesdeGoogle(ev: EventoGoogle, calendarId: string, fechas: FechasLocales) {
  return {
    date: fechas.date,
    time: fechas.time,
    fecha_fin: fechas.fecha_fin,
    hora_fin: fechas.hora_fin,
    title: ev.summary?.trim() || '(Sin título)',
    notes: notasDesdeGoogle(ev.description),
    lugar: ev.location?.trim() || null,
    google_event_id: ev.id,
    google_calendar_id: calendarId,
    google_etag: ev.etag ?? null,
    google_link: ev.htmlLink ?? null,
  }
}

/**
 * Lo que se marca al borrar una fila porque en Google ya no está. A las de Google se les
 * vacía el etag: así, si el evento vuelve (se restauró, o se volvió a mostrar el
 * calendario), se sabe que no lo borró el usuario y se revive.
 */
function borradaPorGoogle(fila: FilaEvento) {
  return {
    deleted_at: ahora(),
    ...SIN_PENDIENTES,
    ...(fila.source === 'google' ? { google_etag: null } : {}),
  }
}

/**
 * Escribe en una fila solo si nadie la cambió desde que se leyó. Devuelve false si la
 * app la editó mientras tanto (entonces su cambio manda y se sube en la próxima corrida).
 */
async function actualizarSiNoCambio(
  admin: Admin,
  fila: FilaEvento,
  cambios: Record<string, unknown>,
): Promise<boolean> {
  const { data, error } = await admin
    .from('calendar_events')
    .update(cambios)
    .eq('id', fila.id)
    .eq('updated_at', fila.updated_at)
    .select('id')
  if (error) throw new Error(error.message)
  return (data?.length ?? 0) > 0
}

/**
 * Tras subir una fila: guarda lo que devolvió Google y la quita de pendientes. Si la app
 * la volvió a cambiar mientras tanto, guarda igual el enlace con Google pero la deja
 * pendiente (con sus campos cambiados), para que ese cambio más nuevo también suba.
 */
async function guardarSubida(admin: Admin, fila: FilaEvento, enlace: Record<string, unknown>) {
  const hecho = await actualizarSiNoCambio(admin, fila, { ...enlace, ...SIN_PENDIENTES })
  if (!hecho && Object.keys(enlace).length > 0) {
    const { error } = await admin.from('calendar_events').update(enlace).eq('id', fila.id)
    if (error) throw new Error(error.message)
  }
}

// --- Calendarios -----------------------------------------------------------------

/**
 * La lista de calendarios de la cuenta, conservando cuáles eligió ver el usuario. Por
 * defecto solo se ve el principal. Si no hay permiso para leer la lista (Google deja
 * desmarcarlo), se queda la que había o, si no había, solo el principal.
 */
export async function listarCalendarios(
  accessToken: string,
  previos: Calendario[],
  email: string | null,
): Promise<Calendario[]> {
  const elegidos = new Map(previos.map((c) => [c.id, c.visible]))
  const items: { id: string; summary?: string; summaryOverride?: string; backgroundColor?: string; primary?: boolean }[] =
    []
  let pageToken: string | undefined
  for (let pagina = 0; pagina < 10; pagina++) {
    const p = new URLSearchParams({
      minAccessRole: 'reader',
      maxResults: '250',
      fields: 'items(id,summary,summaryOverride,backgroundColor,primary),nextPageToken',
    })
    if (pageToken) p.set('pageToken', pageToken)
    const r = await pedirGoogle<{ items?: typeof items; nextPageToken?: string }>(
      accessToken,
      'GET',
      `${API_CALENDARIO}/users/me/calendarList?${p}`,
    )
    if (!r.ok || !r.datos) {
      if (r.status === 401 || esLimiteDeUso(r)) throw new Error(errorDeGoogle(r))
      if (previos.length > 0) return previos
      return [{ id: email ?? 'primary', nombre: 'Principal', principal: true, visible: true }]
    }
    items.push(...(r.datos.items ?? []))
    pageToken = r.datos.nextPageToken
    if (!pageToken) break
  }

  const lista: Calendario[] = items.map((c) => {
    const principal = c.primary === true
    const cal: Calendario = {
      id: c.id,
      nombre: c.summaryOverride || c.summary || c.id,
      principal,
      visible: elegidos.get(c.id) ?? principal,
    }
    if (c.backgroundColor) cal.color = c.backgroundColor
    return cal
  })
  lista.sort((a, b) =>
    a.principal !== b.principal ? (a.principal ? -1 : 1) : a.nombre.localeCompare(b.nombre, 'es'),
  )
  return lista
}

/** Guarda la lista nueva solo si cambió algo más que la visibilidad (que la elige la app). */
async function actualizarCalendarios(admin: Admin, accessToken: string, conexion: Conexion) {
  const previos = conexion.calendarios ?? []
  const lista = await listarCalendarios(accessToken, previos, conexion.email)
  const huella = (cs: Calendario[]) => JSON.stringify(cs.map((c) => [c.id, c.nombre, c.color ?? null, c.principal]))
  if (huella(lista) === huella(previos)) return previos

  // La visibilidad se vuelve a leer justo antes de escribir: la app la pudo cambiar
  // mientras se hablaba con Google.
  const { data } = await admin.from('google_conexion').select('calendarios').eq('user_id', conexion.user_id).maybeSingle()
  const frescos = new Map(((data?.calendarios ?? []) as Calendario[]).map((c) => [c.id, c.visible]))
  const final = lista.map((c) => ({ ...c, visible: frescos.get(c.id) ?? c.visible }))
  await admin.from('google_conexion').update({ calendarios: final }).eq('user_id', conexion.user_id)
  return final
}

// --- Subida ----------------------------------------------------------------------

async function insertarEnGoogle(accessToken: string, fila: FilaEvento): Promise<EventoGoogle> {
  const url = `${API_CALENDARIO}/calendars/primary/events`
  const idFijo = idGoogleDe(fila.id)
  if (idFijo) {
    const r = await pedirGoogle<EventoGoogle>(accessToken, 'POST', url, { ...cuerpoCompleto(fila, false), id: idFijo })
    if (r.ok && r.datos) return r.datos
    if (r.status !== 409) throw new Error(errorDeGoogle(r))
    // Ya existe con ese id: lo creó una corrida que no alcanzó a guardarlo, o es de antes
    // de desconectar. Se actualiza (y se revive si estaba borrado) en vez de duplicarlo.
    const p = await pedirGoogle<EventoGoogle>(accessToken, 'PATCH', `${url}/${idFijo}`, {
      ...cuerpoCompleto(fila, true),
      status: 'confirmed',
    })
    if (p.ok && p.datos) return p.datos
    // 404/410: el id quedó reservado por un evento que ya no existe; se crea con id nuevo.
    if (p.status !== 404 && p.status !== 410) throw new Error(errorDeGoogle(p))
  }
  const r = await pedirGoogle<EventoGoogle>(accessToken, 'POST', url, cuerpoCompleto(fila, false))
  if (!r.ok || !r.datos) throw new Error(errorDeGoogle(r))
  return r.datos
}

type ResultadoPatch =
  | { tipo: 'ok'; evento: EventoGoogle }
  | { tipo: 'sin_cambios' }
  | { tipo: 'gana_google'; evento: EventoGoogle }
  | { tipo: 'no_existe' }
  | { tipo: 'solo_lectura' }

async function actualizarEnGoogle(accessToken: string, fila: FilaEvento): Promise<ResultadoPatch> {
  const url = urlEvento(fila.google_calendar_id!, fila.google_event_id!)
  // Volvió de la papelera de la app: hay que revivirlo entero en Google.
  const restaurada = (fila.google_cambios ?? []).includes('deleted_at')
  const cuerpo = restaurada ? { ...cuerpoCompleto(fila, true), status: 'confirmed' } : cuerpoParcial(fila)
  // Solo cambió algo que no existe en Google (o es una marca vieja sin detalle): nada que mandar.
  if (Object.keys(cuerpo).length === 0) return { tipo: 'sin_cambios' }

  // If-Match: si en Google cambió desde la última vez, Google responde 412 en vez de pisarlo.
  let r = await pedirGoogle<EventoGoogle>(
    accessToken,
    'PATCH',
    url,
    cuerpo,
    fila.google_etag ? { 'If-Match': fila.google_etag } : {},
  )

  if (r.status === 412) {
    // Cambió en los dos lados: gana el cambio más nuevo.
    const actual = await pedirGoogle<EventoGoogle>(accessToken, 'GET', url)
    if (actual.status === 404 || actual.status === 410) return { tipo: 'no_existe' }
    if (!actual.ok || !actual.datos) throw new Error(errorDeGoogle(actual))
    const deGoogle = actual.datos.updated ? new Date(actual.datos.updated).getTime() : 0
    if (deGoogle >= new Date(fila.updated_at).getTime()) return { tipo: 'gana_google', evento: actual.datos }
    // Gana la app. Si allá lo habían borrado, se revive entero; si no, solo lo cambiado.
    const revivir = actual.datos.status === 'cancelled'
    r = await pedirGoogle<EventoGoogle>(
      accessToken,
      'PATCH',
      url,
      revivir ? { ...cuerpoCompleto(fila, true), status: 'confirmed' } : cuerpo,
    )
  }

  if (r.status === 404 || r.status === 410) return { tipo: 'no_existe' }
  if (r.status === 403 || r.status === 429) {
    // Un límite de uso es pasajero: se lanza y la fila sigue pendiente para reintentar.
    if (esLimiteDeUso(r)) throw new Error(errorDeGoogle(r))
    // Calendario de solo lectura (festivos, el de otra persona): no se puede cambiar allá.
    return { tipo: 'solo_lectura' }
  }
  if (!r.ok || !r.datos) throw new Error(errorDeGoogle(r))
  return { tipo: 'ok', evento: r.datos }
}

/** Pone en la fila la versión de Google (o la borra si en Google está cancelado). */
async function aplicarVersionDeGoogle(admin: Admin, fila: FilaEvento, ev: EventoGoogle, calendarId: string) {
  if (ev.status === 'cancelled') {
    await actualizarSiNoCambio(admin, fila, borradaPorGoogle(fila))
    return
  }
  const fechas = desdeGoogle(ev.start, ev.end)
  if (!fechas) {
    await actualizarSiNoCambio(admin, fila, SIN_PENDIENTES)
    return
  }
  await actualizarSiNoCambio(admin, fila, {
    ...columnasDesdeGoogle(ev, calendarId, fechas),
    deleted_at: null,
    ...SIN_PENDIENTES,
  })
}

/** Borra un evento en Google. Lanza si es un límite de uso, para reintentarlo luego. */
async function borrarEnGoogle(accessToken: string, url: string): Promise<boolean> {
  const r = await pedirGoogle(accessToken, 'DELETE', url)
  if (r.ok) return true
  if (esLimiteDeUso(r)) throw new Error(errorDeGoogle(r))
  // 404/410: ya no estaba. 403 (sin ser límite): calendario de solo lectura; en la app
  // queda borrado igual.
  if (r.status === 404 || r.status === 410 || r.status === 403) return false
  throw new Error(errorDeGoogle(r))
}

/** Sube una fila pendiente. Devuelve cuántos cambios llegaron a Google (0 o 1). */
async function subirUna(admin: Admin, accessToken: string, fila: FilaEvento, idPrincipal: string): Promise<number> {
  if (!FUENTES_QUE_SUBEN.has(fila.source)) {
    await actualizarSiNoCambio(admin, fila, SIN_PENDIENTES)
    return 0
  }

  if (fila.deleted_at) {
    let url: string | null = null
    if (fila.google_event_id && fila.google_calendar_id) {
      url = urlEvento(fila.google_calendar_id, fila.google_event_id)
    } else if (fila.source === 'propio' && idGoogleDe(fila.id)) {
      // Sin enlace (por ejemplo, se borró con Google desconectado): si alguna vez se subió,
      // en Google tiene el id fijo derivado del local, así que se puede borrar igual. Si
      // nunca se subió, Google responde 404 y no pasa nada.
      url = `${API_CALENDARIO}/calendars/primary/events/${idGoogleDe(fila.id)}`
    }
    const borrado = url ? await borrarEnGoogle(accessToken, url) : false
    await guardarSubida(admin, fila, {})
    return borrado ? 1 : 0
  }

  if (!fila.google_event_id || !fila.google_calendar_id) {
    const ev = await insertarEnGoogle(accessToken, fila)
    await guardarSubida(admin, fila, {
      google_event_id: ev.id,
      google_calendar_id: idPrincipal,
      google_etag: ev.etag ?? null,
      google_link: ev.htmlLink ?? null,
    })
    return 1
  }

  const res = await actualizarEnGoogle(accessToken, fila)
  switch (res.tipo) {
    case 'ok':
      await guardarSubida(admin, fila, { google_etag: res.evento.etag ?? null, google_link: res.evento.htmlLink ?? fila.google_link })
      return 1
    case 'sin_cambios':
      await guardarSubida(admin, fila, {})
      return 0
    case 'gana_google':
      await aplicarVersionDeGoogle(admin, fila, res.evento, fila.google_calendar_id)
      return 0
    case 'solo_lectura':
      // Sin etag, la próxima bajada vuelve a poner la versión de Google (conservando el
      // tipo y el marcador de importante, que solo existen en la app).
      await actualizarSiNoCambio(admin, fila, { google_etag: null, ...SIN_PENDIENTES })
      return 0
    case 'no_existe': {
      if (fila.source === 'google') {
        await actualizarSiNoCambio(admin, fila, borradaPorGoogle(fila))
        return 0
      }
      // Lo borraron en Google, pero en la app se editó después: se vuelve a crear.
      const ev = await insertarEnGoogle(accessToken, fila)
      await guardarSubida(admin, fila, {
        google_event_id: ev.id,
        google_calendar_id: idPrincipal,
        google_etag: ev.etag ?? null,
        google_link: ev.htmlLink ?? null,
      })
      return 1
    }
  }
}

/** Sube a Google todo lo que la app dejó pendiente. Un fallo en una fila no frena las demás. */
export async function subirPendientes(
  admin: Admin,
  accessToken: string,
  userId: string,
  idPrincipal: string,
): Promise<{ subidos: number; fallidos: number }> {
  const { data, error } = await admin
    .from('calendar_events')
    .select(COLUMNAS_EVENTO)
    .eq('user_id', userId)
    .eq('google_pendiente', true)
    .order('updated_at')
    .limit(300)
  if (error) throw new Error(error.message)

  let subidos = 0
  let fallidos = 0
  await enParalelo((data ?? []) as unknown as FilaEvento[], 3, async (fila) => {
    try {
      subidos += await subirUna(admin, accessToken, fila, idPrincipal)
    } catch (e) {
      fallidos++
      console.error(`Subida a Google fallida (${fila.id}):`, mensajeDe(e))
    }
  })
  return { subidos, fallidos }
}

// --- Bajada ----------------------------------------------------------------------

/** Eventos de un calendario en la ventana, o null si el calendario ya no es accesible. */
async function listarEventos(
  accessToken: string,
  calendarId: string,
  desde: string,
  hasta: string,
): Promise<EventoGoogle[] | null> {
  const eventos: EventoGoogle[] = []
  let pageToken: string | undefined
  for (let pagina = 0; pagina < 20; pagina++) {
    const p = new URLSearchParams({
      singleEvents: 'true',
      showDeleted: 'false',
      maxResults: '2500',
      timeMin: medianocheBogota(desde),
      timeMax: medianocheBogota(sumarDias(hasta, 1)),
      fields:
        'items(id,etag,status,summary,description,location,start,end,updated,htmlLink,eventType,extendedProperties),nextPageToken',
    })
    if (pageToken) p.set('pageToken', pageToken)
    const r = await pedirGoogle<{ items?: EventoGoogle[]; nextPageToken?: string }>(
      accessToken,
      'GET',
      `${API_CALENDARIO}/calendars/${encodeURIComponent(calendarId)}/events?${p}`,
    )
    // Un límite de uso no significa que el calendario desapareció: se reintenta luego.
    if (esLimiteDeUso(r)) throw new Error(errorDeGoogle(r))
    if (r.status === 403 || r.status === 404 || r.status === 410) return null
    if (!r.ok || !r.datos) throw new Error(errorDeGoogle(r))
    eventos.push(...(r.datos.items ?? []))
    pageToken = r.datos.nextPageToken
    if (!pageToken) return eventos
  }
  // Una lista a medias haría creer que lo que falta se borró: mejor no seguir.
  throw new Error(`demasiados_eventos en ${calendarId}`)
}

/**
 * Qué hacer con una fila borrada en la app cuyo evento sigue en Google.
 *
 * - La borró el sistema (calendario oculto, desconexión, o desapareció de Google): solo
 *   pasa con eventos `google`, que quedan con el etag vacío y sin nada pendiente. Se
 *   revive, porque el usuario no la quitó.
 * - La borró el usuario: no se revive nunca (al reconectar, un evento borrado mientras
 *   Google estaba desconectado volvía a aparecer). Se enlaza y queda pendiente, y la
 *   próxima subida lo borra en Google.
 */
export function decisionBorrada(fila: FilaEvento, ev: EventoGoogle, calendarId: string): 'revivir' | 'igual' | 'borrar_en_google' {
  if (fila.source === 'google' && fila.google_etag === null && !fila.google_pendiente) return 'revivir'
  const mismoEnlace = fila.google_event_id === ev.id && fila.google_calendar_id === calendarId
  if (mismoEnlace && fila.google_etag === ev.etag) return 'igual'
  return 'borrar_en_google'
}

async function bajarCalendario(
  admin: Admin,
  accessToken: string,
  userId: string,
  calendarId: string,
  desde: string,
  hasta: string,
): Promise<{ bajados: number; borrados: number }> {
  /*
   * Primero la foto de la base y después la lista de Google. Al revés, algo que otra
   * corrida subiera entre las dos lecturas aparecería con id de Google en la base pero
   * no en la lista, y se daría por borrado.
   */
  const locales = await leerTodas<FilaEvento>((a, b) =>
    admin
      .from('calendar_events')
      .select(COLUMNAS_EVENTO)
      .eq('user_id', userId)
      .eq('google_calendar_id', calendarId)
      .order('id')
      .range(a, b) as unknown as Pagina<FilaEvento>
  )
  const eventos = await listarEventos(accessToken, calendarId, desde, hasta)
  if (!eventos) return { bajados: 0, borrados: 0 }

  const porEventId = new Map<string, FilaEvento>()
  const porId = new Map<string, FilaEvento>()
  for (const f of locales) {
    porId.set(f.id, f)
    if (f.google_event_id) porEventId.set(f.google_event_id, f)
  }

  // Eventos nuestros cuya fila no tiene el id de Google (no alcanzó a guardarlo, o se
  // desconectó y se volvió a conectar): se buscan por mylifeId, borradas incluidas.
  const sueltos = [
    ...new Set(
      eventos
        .filter((ev) => !porEventId.has(ev.id))
        .map((ev) => ev.extendedProperties?.private?.mylifeId)
        .filter((id): id is string => typeof id === 'string' && UUID.test(id) && !porId.has(id)),
    ),
  ]
  for (const grupo of trozos(sueltos, 100)) {
    const { data, error } = await admin.from('calendar_events').select(COLUMNAS_EVENTO).eq('user_id', userId).in('id', grupo)
    if (error) throw new Error(error.message)
    for (const f of (data ?? []) as unknown as FilaEvento[]) porId.set(f.id, f)
  }

  const vistos = new Set<string>()
  const nuevas: Record<string, unknown>[] = []
  const cambios: { fila: FilaEvento; datos: Record<string, unknown> }[] = []

  for (const ev of eventos) {
    if (ev.status === 'cancelled' || ev.eventType === 'workingLocation') continue
    vistos.add(ev.id)
    const fechas = desdeGoogle(ev.start, ev.end)
    if (!fechas) continue

    let fila = porEventId.get(ev.id)
    if (!fila) {
      const mylifeId = ev.extendedProperties?.private?.mylifeId
      const candidata = mylifeId ? porId.get(mylifeId) : undefined
      if (candidata && !candidata.google_event_id) fila = candidata
    }

    const datos = columnasDesdeGoogle(ev, calendarId, fechas)
    if (!fila) {
      nuevas.push({
        id: crypto.randomUUID(),
        user_id: userId,
        type: 'personal',
        important: false,
        source: 'google',
        deleted_at: null,
        ...SIN_PENDIENTES,
        ...datos,
      })
      continue
    }

    if (fila.deleted_at) {
      const decision = decisionBorrada(fila, ev, calendarId)
      if (decision === 'igual') continue
      if (decision === 'borrar_en_google') {
        // Solo el enlace: la fila sigue borrada y pendiente, y la subida borra el evento.
        cambios.push({
          fila,
          datos: {
            google_event_id: ev.id,
            google_calendar_id: calendarId,
            google_etag: ev.etag ?? null,
            google_link: ev.htmlLink ?? null,
            google_pendiente: true,
            google_cambios: [...new Set([...(fila.google_cambios ?? []), 'deleted_at'])].sort(),
          },
        })
        continue
      }
      // 'revivir': sigue abajo como cualquier cambio que viene de Google.
    } else {
      // Mismo etag = nada cambió en Google.
      if (fila.google_etag === ev.etag && fila.google_event_id === ev.id && fila.google_calendar_id === calendarId) {
        continue
      }
      // Cambió en los dos lados: gana el más nuevo. La subida de la app va en la próxima corrida.
      if (fila.google_pendiente && ev.updated && new Date(fila.updated_at) > new Date(ev.updated)) continue
    }

    // Una fila que ya existe conserva el tipo y el marcador de importante elegidos en la app.
    cambios.push({ fila, datos: { ...datos, deleted_at: null, ...SIN_PENDIENTES } })
  }

  // Lo que estaba en la ventana y Google ya no devuelve se borró allá.
  const borrar: FilaEvento[] = []
  for (const fila of locales) {
    if (fila.deleted_at || !fila.google_event_id || vistos.has(fila.google_event_id)) continue
    if (fila.google_pendiente) continue // La subida decide (404 → se recrea o se borra).
    const ultimo = fila.fecha_fin && fila.fecha_fin > fila.date ? fila.fecha_fin : fila.date
    if (ultimo < desde || fila.date > hasta) continue // Fuera de la ventana: no se pidió.
    borrar.push(fila)
  }

  let bajados = 0
  let borrados = 0

  for (const grupo of trozos(nuevas, 100)) {
    const { error } = await admin.from('calendar_events').insert(grupo)
    if (!error) {
      bajados += grupo.length
      continue
    }
    // 23505: otra corrida metió alguno a la vez. Se reintenta de a uno y se saltan esos.
    if (error.code !== '23505') throw new Error(error.message)
    for (const fila of grupo) {
      const { error: e } = await admin.from('calendar_events').insert(fila)
      if (!e) bajados++
      else if (e.code !== '23505') throw new Error(e.message)
    }
  }

  await enParalelo(cambios, 5, async ({ fila, datos }) => {
    if (await actualizarSiNoCambio(admin, fila, datos)) bajados++
  })

  await enParalelo(borrar, 5, async (fila) => {
    if (await actualizarSiNoCambio(admin, fila, borradaPorGoogle(fila))) borrados++
  })

  return { bajados, borrados }
}

/**
 * Los eventos `google` de calendarios ocultos (o que ya no existen) se borran en la app.
 * Se les vacía el etag para que vuelvan si el calendario se vuelve a mostrar.
 */
async function ocultarCalendarios(admin: Admin, userId: string, visibles: Set<string>): Promise<number> {
  const filas = await leerTodas<{ id: string; google_calendar_id: string | null }>((a, b) =>
    admin
      .from('calendar_events')
      .select('id, google_calendar_id')
      .eq('user_id', userId)
      .eq('source', 'google')
      .is('deleted_at', null)
      .order('id')
      .range(a, b) as unknown as Pagina<{ id: string; google_calendar_id: string | null }>
  )
  const ids = filas.filter((f) => !f.google_calendar_id || !visibles.has(f.google_calendar_id)).map((f) => f.id)
  for (const grupo of trozos(ids, 200)) {
    const { error } = await admin
      .from('calendar_events')
      .update({ deleted_at: ahora(), google_etag: null, ...SIN_PENDIENTES })
      .in('id', grupo)
    if (error) throw new Error(error.message)
  }
  return ids.length
}

async function bajarDeGoogle(admin: Admin, accessToken: string, userId: string, calendarios: Calendario[]) {
  const hoy = hoyEnBogota()
  const desde = sumarDias(hoy, -60)
  const hasta = sumarDias(hoy, 365)
  const visibles = calendarios.filter((c) => c.visible)

  let bajados = 0
  let borrados = 0
  for (const cal of visibles) {
    const r = await bajarCalendario(admin, accessToken, userId, cal.id, desde, hasta)
    bajados += r.bajados
    borrados += r.borrados
  }
  borrados += await ocultarCalendarios(admin, userId, new Set(visibles.map((c) => c.id)))
  return { bajados, borrados }
}

// --- Corrida completa ------------------------------------------------------------

export async function sincronizarUsuario(admin: Admin, config: ConfigGoogle, conexion: Conexion): Promise<ResultadoSync> {
  const userId = conexion.user_id
  try {
    const accessToken = await accessTokenDe(admin, config, userId)
    const calendarios = await actualizarCalendarios(admin, accessToken, conexion)
    const idPrincipal = idCalendarioPrincipal(calendarios, conexion.email)

    const subida = await subirPendientes(admin, accessToken, userId, idPrincipal)
    const bajada = await bajarDeGoogle(admin, accessToken, userId, calendarios)

    await admin
      .from('google_conexion')
      .update({
        ultima_sync: ahora(),
        ultimo_error: subida.fallidos > 0
          ? `No se pudieron subir ${subida.fallidos} evento(s); se reintenta en la próxima sincronización.`
          : null,
      })
      .eq('user_id', userId)

    return { subidos: subida.subidos, bajados: bajada.bajados, borrados: bajada.borrados }
  } catch (e) {
    // 'reconectar' ya lo dejó anotado accessTokenDe.
    if (!(e instanceof ErrorReconectar)) {
      await admin
        .from('google_conexion')
        .update({ ultimo_error: `Error al sincronizar: ${mensajeDe(e)}`.slice(0, 300) })
        .eq('user_id', userId)
    }
    throw e
  }
}

/**
 * Las conexiones de un usuario (o de todos, para el cron), solo de usuarios permitidos:
 * una conexión de otra cuenta no se sincroniza.
 */
export async function leerConexiones(admin: Admin, userId?: string): Promise<Conexion[]> {
  let consulta = admin.from('google_conexion').select('user_id, email, scopes, calendarios')
  if (userId) consulta = consulta.eq('user_id', userId)
  const [{ data, error }, permitidos] = await Promise.all([consulta, idsPermitidos(admin)])
  if (error) throw new Error(error.message)
  return ((data ?? []) as Conexion[]).filter((c) => permitidos.has(c.user_id))
}
