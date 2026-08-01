/**
 * Todo lo de fechas en un solo sitio. Las fechas de la app son texto ISO
 * `YYYY-MM-DD` y la aritmética se hace en UTC a mediodía-cero para que nunca
 * haya saltos de día por zona horaria.
 *
 * El "hoy" sí se calcula en la zona de Colombia: con `toISOString()` la app
 * cambiaba de día a las 7 de la tarde hora local.
 */

const TIME_ZONE = 'America/Bogota'
export const DAY_MS = 86_400_000

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// en-CA formatea como YYYY-MM-DD, que es justo el formato que usa la app.
const ISO_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const LONG_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Permite simular otra fecha en desarrollo: `#/?fecha=2026-08-20`. */
function devDateOverride(): string | null {
  if (typeof window === 'undefined') return null
  const { search, hash } = window.location
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?')) : ''
  for (const query of [search, hashQuery]) {
    const value = new URLSearchParams(query).get('fecha')
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  }
  return null
}

/** Hoy, en hora de Colombia. */
export function todayISO(): string {
  if (import.meta.env.DEV) {
    const override = devDateOverride()
    if (override) return override
  }
  return ISO_FORMATTER.format(new Date())
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(toUTCDate(iso).getTime() + days * DAY_MS))
}

/** Días de `fromIso` a `toIso` (negativo si `toIso` es anterior). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUTCDate(toIso).getTime() - toUTCDate(fromIso).getTime()) / DAY_MS)
}

/** 0 = domingo … 6 = sábado */
export function weekdayIndex(iso: string): number {
  return toUTCDate(iso).getUTCDay()
}

export function weekdayName(iso: string): string {
  return WEEKDAYS[weekdayIndex(iso)]
}

/** Lunes de la semana a la que pertenece la fecha. */
export function weekStart(iso: string): string {
  const day = weekdayIndex(iso)
  return addDays(iso, day === 0 ? -6 : 1 - day)
}

/** "Martes, 28 de julio" (solo la primera letra en mayúscula). */
export function formatLong(iso: string): string {
  const text = LONG_FORMATTER.format(toUTCDate(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "28/07" */
export function formatShort(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}
