import { API_GMAIL, errorDeGoogle, pedirGoogle } from '../_shared/google.ts'
import { htmlATexto, partesEnBogota } from '../_shared/fechas.ts'

/**
 * Leer correos de Gmail y dejarlos en texto plano para Claude.
 */

/*
 * Solo lo que Gmail ya marcó como importante, sin promociones, redes ni foros, y nada
 * enviado por uno mismo. Dos días hacia atrás bastan con un cron cada 30 minutos y dejan
 * margen si una corrida falla.
 */
export const CONSULTA_GMAIL =
  'is:important newer_than:2d -category:promotions -category:social -category:forums -from:me'

/** Lo que se le pasa a Claude por correo: más es gastar tokens en firmas y pies legales. */
const MAX_CARACTERES = 6000

interface Parte {
  mimeType?: string
  filename?: string
  headers?: { name: string; value: string }[]
  body?: { data?: string; size?: number }
  parts?: Parte[]
}

interface Mensaje {
  id: string
  internalDate?: string
  snippet?: string
  payload?: Parte
}

export interface Correo {
  id: string
  asunto: string
  remitente: string
  /** Fecha y hora de envío en Bogotá, para que Claude resuelva «mañana» o «el viernes». */
  fecha: string
  hora: string
  texto: string
}

/** Ids de los correos que cumplen la búsqueda (los más nuevos primero). */
export async function buscarCorreos(accessToken: string, maximo = 50): Promise<string[]> {
  const p = new URLSearchParams({ q: CONSULTA_GMAIL, maxResults: String(maximo) })
  const r = await pedirGoogle<{ messages?: { id: string }[] }>(accessToken, 'GET', `${API_GMAIL}/messages?${p}`)
  if (!r.ok || !r.datos) throw new Error(errorDeGoogle(r))
  return (r.datos.messages ?? []).map((m) => m.id)
}

function cabecera(parte: Parte | undefined, nombre: string): string {
  const h = parte?.headers?.find((c) => c.name.toLowerCase() === nombre.toLowerCase())
  return h?.value?.trim() ?? ''
}

/** El cuerpo viene en base64url y en el charset de la parte (casi siempre UTF-8). */
function decodificar(datos: string, tipoContenido: string): string {
  const binario = atob(datos.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0))
  const charset = /charset="?([\w-]+)"?/i.exec(tipoContenido)?.[1]?.toLowerCase() ?? 'utf-8'
  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

/** Primer texto plano y primer HTML del árbol MIME, saltándose los adjuntos. */
function buscarCuerpos(parte: Parte | undefined, encontrado: { plano?: string; html?: string } = {}) {
  if (!parte) return encontrado
  const tipo = (parte.mimeType ?? '').toLowerCase()
  if (!parte.filename && parte.body?.data) {
    const contenidoTipo = cabecera(parte, 'Content-Type')
    if (tipo === 'text/plain' && !encontrado.plano) encontrado.plano = decodificar(parte.body.data, contenidoTipo)
    if (tipo === 'text/html' && !encontrado.html) encontrado.html = decodificar(parte.body.data, contenidoTipo)
  }
  for (const hija of parte.parts ?? []) buscarCuerpos(hija, encontrado)
  return encontrado
}

/** «Nombre <correo@x>» → «Nombre»; si no hay nombre, el correo. */
function nombreDelRemitente(de: string): string {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(de)
  if (m) return (m[1].trim() || m[2].trim()).slice(0, 200)
  return de.slice(0, 200)
}

export async function leerCorreo(accessToken: string, id: string): Promise<Correo> {
  const p = new URLSearchParams({ format: 'full', fields: 'id,internalDate,snippet,payload' })
  const r = await pedirGoogle<Mensaje>(accessToken, 'GET', `${API_GMAIL}/messages/${encodeURIComponent(id)}?${p}`)
  if (!r.ok || !r.datos) throw new Error(errorDeGoogle(r))
  const m = r.datos

  const { plano, html } = buscarCuerpos(m.payload)
  // Muchos correos traen un texto plano de relleno («ver en el navegador»): si es muy
  // corto y hay HTML, el HTML dice más.
  let texto = plano && plano.trim().length > 200 ? plano : html ? htmlATexto(html.slice(0, 300_000)) : (plano ?? '')
  if (!texto.trim()) texto = m.snippet ?? ''
  texto = texto.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_CARACTERES)

  const enviado = m.internalDate ? new Date(Number(m.internalDate)) : new Date()
  const { fecha, hora } = partesEnBogota(enviado)

  return {
    id: m.id,
    asunto: cabecera(m.payload, 'Subject').slice(0, 300) || '(sin asunto)',
    remitente: nombreDelRemitente(cabecera(m.payload, 'From')),
    fecha,
    hora,
    texto,
  }
}
