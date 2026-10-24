import { isHoliday } from '../data/holidays'
import { noClassReason } from '../data/schoolCalendar'
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

/**
 * Por qué ese día no hay colegio, o `undefined` si sí lo hay. Cubre las tres cosas
 * que paran el ciclo: fin de semana, festivo de Colombia y día sin clase del colegio
 * (Recess Week, Semana Santa, Professional Development Days, vacaciones).
 */
export function noSchoolReason(dateISO: string, extraNoClass: string[] = []): string | undefined {
  if (isWeekend(dateISO)) return 'Fin de semana'
  if (isHoliday(dateISO)) return 'Festivo'
  return noClassReason(dateISO, extraNoClass)
}

/** Un día cuenta para el ciclo solo si de verdad hay clases. */
export function isSchoolDay(dateISO: string, extraNoClass: string[] = []): boolean {
  return noSchoolReason(dateISO, extraNoClass) === undefined
}

/** Días de colegio recorridos entre dos fechas (con signo). */
function schoolDayDelta(fromISO: string, toISO: string, extraNoClass: string[]): number {
  if (fromISO === toISO) return 0
  const step = toISO > fromISO ? 1 : -1
  let d = fromISO
  let count = 0
  for (let i = 0; i < 3660 && d !== toISO; i++) {
    d = addDays(d, step)
    if (isSchoolDay(d, extraNoClass)) count += step
  }
  return count
}

export interface CycleInfo {
  schoolDay: boolean
  cycleDay: number | null
  /** Por qué no hay ciclo hoy, cuando `schoolDay` es falso. */
  reason?: string
}

/**
 * Día del ciclo (1..6) para una fecha. Parte del ancla o del reinicio más reciente,
 * avanzando solo en días de colegio. Fines de semana, festivos y días sin clase del
 * colegio no cuentan: el ciclo se congela y sigue donde iba al volver.
 */
export function cycleInfoFor(dateISO: string, config: SchoolConfig): CycleInfo {
  const extra = config.noClassDays ?? []
  const reason = noSchoolReason(dateISO, extra)
  if (reason) return { schoolDay: false, cycleDay: null, reason }

  let baseDate = config.anchorDate
  let baseDay = config.anchorDay
  for (const o of config.overrides) {
    if (o.date <= dateISO && o.date >= baseDate) {
      baseDate = o.date
      baseDay = o.day
    }
  }

  const delta = schoolDayDelta(baseDate, dateISO, extra)
  const cycleDay = ((((baseDay - 1 + delta) % 6) + 6) % 6) + 1
  return { schoolDay: true, cycleDay }
}

/**
 * Primera fecha, desde `fromISO` (incluida), que cae en ese día del ciclo.
 *
 * Sirve para pintar un día del ciclo con las horas de la fecha en que de verdad toca:
 * un miércoles, el «Día 4» que se consulta es el del jueves y sale a las 3:05, no a
 * la 1:05. Dos ciclos de 6 días caben de sobra en 60 días aunque haya un festivo o
 * una semana de receso en medio; más allá (vacaciones largas) devuelve `null`.
 */
export function nextDateForCycleDay(
  fromISO: string,
  cycleDay: number,
  config: SchoolConfig,
  maxDays = 60,
): string | null {
  for (let i = 0; i <= maxDays; i++) {
    const date = addDays(fromISO, i)
    if (cycleInfoFor(date, config).cycleDay === cycleDay) return date
  }
  return null
}

/**
 * Siguiente día con clases DESPUÉS de `fromISO`, con su día del ciclo. Es lo que se
 * muestra el fin de semana o un festivo («Descanso — el lunes te toca Día 3») y
 * también por la tarde, cuando las clases de hoy ya terminaron.
 *
 * Salta los días sin clase con `isSchoolDay`, que es barato, y solo al encontrar uno
 * calcula su día del ciclo (`cycleInfoFor` cuenta desde el ancla): así salen bien
 * hasta unas vacaciones de un mes sin recorrer el ciclo en cada fecha.
 */
export function nextSchoolDay(
  fromISO: string,
  config: SchoolConfig,
  maxDays = 400,
): { date: string; cycleDay: number } | null {
  const extra = config.noClassDays ?? []
  for (let i = 1; i <= maxDays; i++) {
    const date = addDays(fromISO, i)
    if (!isSchoolDay(date, extra)) continue
    const { cycleDay } = cycleInfoFor(date, config)
    return cycleDay ? { date, cycleDay } : null
  }
  return null
}
