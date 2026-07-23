import { isHoliday } from '../data/holidays'
import type { SchoolConfig } from '../data/schoolTypes'

const DAY_MS = 86_400_000

function toUTC(dateISO: string): Date {
  return new Date(`${dateISO}T00:00:00Z`)
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(dateISO: string, n: number): string {
  return iso(new Date(toUTC(dateISO).getTime() + n * DAY_MS))
}

function isWeekend(dateISO: string): boolean {
  const g = toUTC(dateISO).getUTCDay()
  return g === 0 || g === 6
}

/** Un día cuenta para el ciclo si es entre semana y no es festivo. */
export function isSchoolDay(dateISO: string): boolean {
  return !isWeekend(dateISO) && !isHoliday(dateISO)
}

/** Días de colegio recorridos entre dos fechas (con signo). */
function schoolDayDelta(fromISO: string, toISO: string): number {
  if (fromISO === toISO) return 0
  const step = toISO > fromISO ? 1 : -1
  let d = fromISO
  let count = 0
  for (let i = 0; i < 3660 && d !== toISO; i++) {
    d = addDays(d, step)
    if (isSchoolDay(d)) count += step
  }
  return count
}

export interface CycleInfo {
  schoolDay: boolean
  cycleDay: number | null
}

/**
 * Día del ciclo (1..6) para una fecha. Parte del ancla o del reinicio más reciente,
 * avanzando solo en días de colegio. Fines de semana y festivos → sin día de ciclo.
 */
export function cycleInfoFor(dateISO: string, config: SchoolConfig): CycleInfo {
  if (!isSchoolDay(dateISO)) return { schoolDay: false, cycleDay: null }

  let baseDate = config.anchorDate
  let baseDay = config.anchorDay
  for (const o of config.overrides) {
    if (o.date <= dateISO && o.date >= baseDate) {
      baseDate = o.date
      baseDay = o.day
    }
  }

  const delta = schoolDayDelta(baseDate, dateISO)
  const cycleDay = ((((baseDay - 1 + delta) % 6) + 6) % 6) + 1
  return { schoolDay: true, cycleDay }
}
