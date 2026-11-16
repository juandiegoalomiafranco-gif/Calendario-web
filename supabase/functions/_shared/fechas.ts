/**
 * Fechas y horas entre Google y la app.
 *
 * La app guarda fechas como 'YYYY-MM-DD' y horas como 'HH:MM', siempre en hora de
 * Colombia (como `src/lib/dates.ts`). Google habla en instantes con zona. Todo lo que
 * pasa de un lado a otro se convierte aquí, para que las reglas (fin exclusivo de los
 * eventos de todo el día, duración por defecto, eventos que cruzan la medianoche) estén
 * en un solo sitio.
 */

export const ZONA = 'America/Bogota'

/*
 * Colombia no tiene horario de verano desde 1993: el desfase es siempre -05:00. Solo
 * se usa para armar los límites de la ventana de búsqueda; las conversiones de verdad
 * van con Intl y la zona por nombre.
 */
const DESFASE_BOGOTA = '-05:00'

const FORMATO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Fecha ('YYYY-MM-DD') y hora ('HH:MM') en Bogotá de un instante. */
export function partesEnBogota(instante: Date): { fecha: string; hora: string } {
  const p: Record<string, string> = {}
  for (const parte of FORMATO.formatToParts(instante)) p[parte.type] = parte.value
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` }
}

export function hoyEnBogota(ahora = new Date()): string {
  return partesEnBogota(ahora).fecha
}

/** Aritmética de fechas ISO en UTC: así un día suma siempre un día. */
export function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function esFecha(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const d = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor
}

export function esHora(valor: unknown): valor is string {
  return typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor)
}

/** Medianoche de Bogotá de una fecha, en RFC 3339 (para timeMin/timeMax de Google). */
export function medianocheBogota(fecha: string): string {
  return `${fecha}T00:00:00${DESFASE_BOGOTA}`
}

export interface FechasLocales {
  date: string
  time: string | null
  fecha_fin: string | null
  hora_fin: string | null
}

export interface MomentoGoogle {
  date?: string | null
  dateTime?: string | null
  timeZone?: string | null
}

/** De `start`/`end` de Google a las columnas de la app. Null si no se entiende. */
export function desdeGoogle(
  inicio: MomentoGoogle | undefined,
  fin: MomentoGoogle | undefined,
): FechasLocales | null {
  if (inicio?.date && esFecha(inicio.date)) {
    const date = inicio.date
    // En Google el fin de un evento de todo el día es exclusivo; en la app es el último día.
    let ultimo = fin?.date && esFecha(fin.date) ? sumarDias(fin.date, -1) : date
    if (ultimo < date) ultimo = date
    return { date, time: null, fecha_fin: ultimo > date ? ultimo : null, hora_fin: null }
  }

  if (inicio?.dateTime) {
    const ini = new Date(inicio.dateTime)
    if (Number.isNaN(ini.getTime())) return null
    const a = partesEnBogota(ini)
    let fecha_fin: string | null = null
    let hora_fin: string | null = null

    const f = fin?.dateTime ? new Date(fin.dateTime) : null
    if (f && !Number.isNaN(f.getTime()) && f >= ini) {
      const b = partesEnBogota(f)
      hora_fin = b.hora
      // Si termina justo a medianoche, el último día que ocupa es el anterior.
      const ultimo = b.hora === '00:00' && b.fecha > a.fecha ? sumarDias(b.fecha, -1) : b.fecha
      fecha_fin = ultimo > a.fecha ? ultimo : null
    }
    return { date: a.fecha, time: a.hora, fecha_fin, hora_fin }
  }

  return null
}

function sumarMinutos(hora: string, minutos: number): { hora: string; dias: number } {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  const dias = Math.floor(total / 1440)
  const resto = ((total % 1440) + 1440) % 1440
  const hh = String(Math.floor(resto / 60)).padStart(2, '0')
  const mm = String(resto % 60).padStart(2, '0')
  return { hora: `${hh}:${mm}`, dias }
}

/**
 * De las columnas de la app a `start`/`end` de Google.
 *
 * - Sin hora: evento de todo el día (fin exclusivo = último día + 1).
 * - Con hora y sin hora de fin: una hora de duración, como hace Google al crear uno.
 * - Hora de fin menor que la de inicio el mismo día: cruza la medianoche.
 *
 * `paraPatch` pone en null el campo contrario: al pasar un evento de todo el día a uno
 * con hora (o al revés), Google mezcla lo viejo con lo nuevo si no se borra a mano.
 */
export function haciaGoogle(
  f: FechasLocales,
  paraPatch = false,
): { start: MomentoGoogle; end: MomentoGoogle } {
  const ultimo = f.fecha_fin && esFecha(f.fecha_fin) && f.fecha_fin > f.date ? f.fecha_fin : f.date

  if (!esHora(f.time)) {
    const start: MomentoGoogle = { date: f.date }
    const end: MomentoGoogle = { date: sumarDias(ultimo, 1) }
    if (paraPatch) {
      start.dateTime = null
      start.timeZone = null
      end.dateTime = null
      end.timeZone = null
    }
    return { start, end }
  }

  const time = f.time
  let finFecha: string
  let finHora: string
  if (esHora(f.hora_fin)) {
    finHora = f.hora_fin
    if (finHora === '00:00' && (ultimo > f.date || time !== '00:00')) {
      // Termina a medianoche: es el comienzo del día siguiente al último.
      finFecha = sumarDias(ultimo, 1)
    } else if (ultimo === f.date && finHora < time) {
      finFecha = sumarDias(f.date, 1)
    } else {
      finFecha = ultimo
    }
  } else {
    const r = sumarMinutos(time, 60)
    finHora = r.hora
    finFecha = sumarDias(ultimo, r.dias)
  }

  const start: MomentoGoogle = { dateTime: `${f.date}T${time}:00`, timeZone: ZONA }
  const end: MomentoGoogle = { dateTime: `${finFecha}T${finHora}:00`, timeZone: ZONA }
  if (paraPatch) {
    start.date = null
    end.date = null
  }
  return { start, end }
}

/** Una entidad numérica fuera de rango haría lanzar a fromCodePoint con un HTML mal hecho. */
function caracter(codigo: number): string {
  return Number.isInteger(codigo) && codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : ' '
}

/** Texto plano a partir de la descripción en HTML de un evento de Google. */
export function htmlATexto(html: string): string {
  return html
    .replace(/<(script|style|head|title)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => caracter(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => caracter(parseInt(n, 16)))
    .replace(/[ \t\f\v\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
