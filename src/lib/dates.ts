/**
 * Utilidades de fecha en ISO (YYYY-MM-DD). Todo se interpreta en UTC —igual que
 * `weekdayOf` de data/plan.ts y `cycle.ts`— para que el día nunca se corra por la
 * zona horaria. Este archivo es el único sitio donde viven estas operaciones.
 */

export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Nombres de lunes a domingo, el orden en el que se dibuja el calendario. */
export const WEEKDAY_LONG = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
]

export const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

/** Iniciales del calendario. Miércoles usa X, como es habitual en español. */
export const WEEKDAY_INITIAL = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Fecha de hoy en ISO. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = utc(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIso(d)
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(iso: string): number {
  return (utc(iso).getUTCDay() + 6) % 7
}

export function isWeekend(iso: string): boolean {
  return weekdayIndex(iso) >= 5
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso))
}

/** Los siete días (lunes → domingo) de la semana de esa fecha. */
export function weekDays(iso: string): string[] {
  const monday = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function dayNumber(iso: string): number {
  return utc(iso).getUTCDate()
}

export function monthIndex(iso: string): number {
  return utc(iso).getUTCMonth()
}

export function yearOf(iso: string): number {
  return utc(iso).getUTCFullYear()
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** "26 de julio" */
export function formatDayMonth(iso: string): string {
  return `${dayNumber(iso)} de ${MONTHS[monthIndex(iso)]}`
}

/** "Julio 2026" */
export function formatMonthYear(iso: string): string {
  const name = MONTHS[monthIndex(iso)]
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${yearOf(iso)}`
}

/** "15 jul" — para ejes de gráficos y encabezados estrechos. */
export function formatShort(iso: string): string {
  return `${dayNumber(iso)} ${MONTHS[monthIndex(iso)].slice(0, 3)}`
}

/** "miércoles" */
export function weekdayLong(iso: string): string {
  return WEEKDAY_LONG[weekdayIndex(iso)]
}

/** "miércoles, 22 de julio" */
export function formatFull(iso: string): string {
  return `${weekdayLong(iso)}, ${formatDayMonth(iso)}`
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function addMonths(iso: string, months: number): string {
  const d = utc(startOfMonth(iso))
  d.setUTCMonth(d.getUTCMonth() + months)
  return toIso(d)
}

/**
 * Rejilla del mes: semanas completas de lunes a domingo que cubren todo el mes,
 * incluyendo los días de relleno del mes anterior y del siguiente.
 */
export function monthMatrix(iso: string): string[][] {
  const first = startOfMonth(iso)
  const lastDay = addDays(addMonths(first, 1), -1)
  const weeks: string[][] = []
  let cursor = startOfWeek(first)
  while (cursor <= lastDay) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

/** Días entre dos fechas (b − a). Negativo si `b` ya pasó. */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000)
}

/** "hoy", "mañana", "en 3 días", "hace 2 días". */
export function relativeDay(iso: string, from = todayIso()): string {
  const diff = daysBetween(from, iso)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  if (diff === -1) return 'ayer'
  if (diff > 0) return `en ${diff} días`
  return `hace ${-diff} días`
}

// --- Horas del día -----------------------------------------------------------

/** Convierte "10:30" a minutos desde medianoche. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Minutos transcurridos hoy, para saber qué clase está en curso. */
export function nowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

/** "8:10" a partir de minutos desde medianoche. */
export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
