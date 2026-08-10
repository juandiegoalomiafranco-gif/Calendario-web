import { PLAN } from '../data/plan'
import { activityKeyOf, type ActivityKey } from '../data/activityMeta'
import type { DayPlan, Session } from '../data/types'

/** Índice por fecha: el calendario consulta días sueltos muchas veces por render. */
const BY_DATE = new Map<string, DayPlan>(PLAN.map((d) => [d.date, d]))

export const PLAN_START = PLAN[0]?.date ?? ''
export const PLAN_END = PLAN[PLAN.length - 1]?.date ?? ''

export function dayAt(date: string): DayPlan | undefined {
  return BY_DATE.get(date)
}

export function sessionsOn(date: string): Session[] {
  return BY_DATE.get(date)?.sessions ?? []
}

export function isInPlan(date: string): boolean {
  return BY_DATE.has(date)
}

/**
 * Acerca una fecha al rango del plan. Si hoy cae fuera (el plan aún no empieza
 * o ya terminó), el calendario abre en el extremo más cercano en vez de en una
 * semana vacía. El botón "Hoy" sigue llevando al día real.
 */
export function clampToPlan(date: string): string {
  if (PLAN_START && date < PLAN_START) return PLAN_START
  if (PLAN_END && date > PLAN_END) return PLAN_END
  return date
}

/** Familias de actividad presentes en un día, sin repetir y en orden de aparición. */
export function activityKeysOn(date: string): ActivityKey[] {
  const seen: ActivityKey[] = []
  for (const s of sessionsOn(date)) {
    const key = activityKeyOf(s.type)
    if (!seen.includes(key)) seen.push(key)
  }
  return seen
}

/** Todas las sesiones del plan con su fecha, para las estadísticas. */
export function allSessionsWithDate(): (Session & { date: string })[] {
  return PLAN.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date })))
}

/**
 * Sesiones clave del plan: el intento de 21 km y los fondos largos.
 * Alimenta el bloque "Sesiones clave" de la barra lateral.
 */
export function keySessions(): { date: string; session: Session }[] {
  return PLAN.flatMap((d) =>
    d.sessions
      .filter((s) => s.type === 'running-goal' || s.type === 'running-long')
      .map((session) => ({ date: d.date, session })),
  )
}
