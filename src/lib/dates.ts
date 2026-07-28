// Formateo de fechas legible en español. Las fechas del plan son YYYY-MM-DD y en
// el resto del código se interpretan en UTC (ver weeks.ts / plan.ts); aquí se hace
// igual y se formatea con timeZone: 'UTC' para que el día no se corra según la
// zona horaria del dispositivo.

function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

const LONG = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const MEDIUM = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const SHORT = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const DAY_MONTH = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** "martes, 28 de julio" */
export function formatLongDate(iso: string): string {
  return LONG.format(toUTCDate(iso))
}

/** "mar, 28 jul" */
export function formatMediumDate(iso: string): string {
  return MEDIUM.format(toUTCDate(iso))
}

/** "28 jul" */
export function formatShortDate(iso: string): string {
  return SHORT.format(toUTCDate(iso))
}

/** "5 de agosto" */
export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(toUTCDate(iso))
}

/** "28 jul – 3 ago" */
export function formatWeekRange(startIso: string, endIso: string): string {
  return `${formatShortDate(startIso)} – ${formatShortDate(endIso)}`
}

/** Días de diferencia (redondeados) entre dos fechas ISO. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUTCDate(toIso).getTime() - toUTCDate(fromIso).getTime()) / 86_400_000)
}

/** Pone en mayúscula solo la primera letra (Intl en español devuelve todo en minúscula). */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
