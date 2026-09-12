/**
 * Fechas en **hora local**, no UTC. La versión anterior de la app usaba
 * `new Date().toISOString().slice(0, 10)`, que en Colombia (UTC-5) adelantaba el día
 * a partir de las 7:00 p.m.: un gasto de las 8 p.m. quedaba registrado mañana.
 */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD de una fecha, en el calendario local del dispositivo. */
export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** El día de hoy según el reloj local. */
export function todayISO(): string {
  return toLocalISO(new Date())
}

/** YYYY-MM del mes actual. */
export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

/** YYYY-MM al que pertenece una fecha YYYY-MM-DD. */
export function monthOf(dateIso: string): string {
  return dateIso.slice(0, 7)
}

/** Convierte YYYY-MM-DD a Date local a medianoche, sin corrimiento de zona. */
export function parseLocalDate(dateIso: string): Date {
  const [y, m, d] = dateIso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Desplaza un YYYY-MM en `delta` meses. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** Los últimos `count` meses terminando en `month` (incluido), del más viejo al más nuevo. */
export function lastMonths(month: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(month, i - (count - 1)))
}

/** "septiembre 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTHS[m - 1] ?? month} ${y}`
}

/** "sep 2026" */
export function formatMonthShort(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1] ?? month} ${String(y).slice(2)}`
}

/** "12 de septiembre" — o "12 de septiembre de 2025" si no es el año en curso. */
export function formatDate(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number)
  const base = `${d} de ${MONTHS[m - 1] ?? ''}`
  return y === new Date().getFullYear() ? base : `${base} de ${y}`
}

/** "sábado, 12 de septiembre" — con "Hoy" y "Ayer" cuando aplica. */
export function formatDateLong(dateIso: string): string {
  const today = todayISO()
  if (dateIso === today) return `Hoy, ${formatDate(dateIso)}`
  const yesterday = toLocalISO(new Date(parseLocalDate(today).getTime() - 86_400_000))
  if (dateIso === yesterday) return `Ayer, ${formatDate(dateIso)}`
  return `${WEEKDAYS[parseLocalDate(dateIso).getDay()]}, ${formatDate(dateIso)}`
}

/** Meses completos entre dos fechas, mínimo 0. Sirve para el ahorro mensual de una meta. */
export function monthsBetween(fromIso: string, toIso: string): number {
  const from = parseLocalDate(fromIso)
  const to = parseLocalDate(toIso)
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return Math.max(0, months)
}

/** Días entre dos fechas (negativo si `toIso` ya pasó). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = parseLocalDate(toIso).getTime() - parseLocalDate(fromIso).getTime()
  return Math.round(ms / 86_400_000)
}
