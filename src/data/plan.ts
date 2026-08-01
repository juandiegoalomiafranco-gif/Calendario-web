/**
 * Fachada del plan. Las páginas solo hablan con este archivo; detrás está el
 * motor (`src/lib/planEngine.ts`) que genera los días a partir del programa.
 *
 * Para cambiar el entrenamiento ya no hay que editar día por día: se ajusta la
 * semana tipo o la progresión en `src/data/program.ts`, o se cambia la meta
 * desde la propia app.
 */
import type { DayPlan } from './types'
import { buildDay, buildRange, type PlanGoal } from '../lib/planEngine'
import { toUTCDate } from '../lib/dates'

export { PROGRAM_START } from './program'
export type { PlanGoal }

export const PRINCIPLES: string[] = [
  'El esfuerzo manda, no el ritmo: en los rodajes fáciles, ve más lento de lo que creas necesario.',
  'Nunca apiles dos sesiones fuertes de pierna seguidas si lo puedes evitar — el funcional y el deporte ya cubren esa dosis.',
  'El fútbol y el vóley cuentan como sesión de alta intensidad: sustituyen una sesión de la semana, no se suman a todo lo demás.',
  'Dolor articular no es lo mismo que dolor muscular. El primero cancela la sesión; el segundo se maneja con foam roller y sigue el plan.',
  'Nunca se corre la distancia completa del objetivo justo antes del día clave: el último fondo se queda corto a propósito.',
  'La base aeróbica se construye con constancia, no con velocidad. Las semanas de descarga son parte de la construcción.',
]

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(toUTCDate(date).getTime())
}

/** Plan de un día. `undefined` solo si la fecha no es válida. */
export function getDayPlan(date: string, goal?: PlanGoal): DayPlan | undefined {
  return isValidDate(date) ? buildDay(date, goal) : undefined
}

/** Plan de un rango de fechas, ambos extremos incluidos. */
export function getRange(fromIso: string, toIso: string, goal?: PlanGoal): DayPlan[] {
  if (!isValidDate(fromIso) || !isValidDate(toIso)) return []
  return buildRange(fromIso, toIso, goal)
}
