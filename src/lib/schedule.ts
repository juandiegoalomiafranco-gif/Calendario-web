import type { Session, SessionType } from '../data/types'

/**
 * Horario de presentación para la rejilla del calendario.
 *
 * El plan sólo guarda la franja (AM / PM / todo el día), no una hora exacta —
 * y esos datos no se tocan. Aquí derivamos una hora coherente a partir del tipo
 * de sesión para poder dibujar la rejilla horaria de escritorio. Es únicamente
 * visual: nada de esto se guarda ni altera `src/data/plan.ts`.
 */

export interface TimeRange {
  /** Hora de inicio en horas decimales (6.5 = 6:30). */
  start: number
  /** Hora de fin en horas decimales. */
  end: number
}

/**
 * Rango de horas que dibuja la rejilla. Se ajusta a lo que usa el plan
 * (la sesión más temprana empieza a las 6:00 y la más tardía acaba a las 19:30)
 * para que la mañana y la tarde quepan a la vez sin desplazarse.
 */
export const GRID_START_HOUR = 5
export const GRID_END_HOUR = 20

/** Duración típica de cada tipo de sesión, en minutos. */
const DURATION_MIN: Record<SessionType, number> = {
  crossfit: 90,
  'running-easy': 75,
  'running-long': 150,
  'running-shakeout': 45,
  'running-goal': 180,
  'swim-technique': 75,
  'swim-endurance': 75,
  flex: 90,
  rest: 0,
}

/** Hora a la que arranca cada franja. El funcional entra media hora más tarde. */
const MORNING_START = 6
const CROSSFIT_START = 6.5
const EVENING_START = 18

/**
 * Franja horaria de una sesión, o `null` si va en la fila de "todo el día"
 * (los descansos, que no ocupan una hora concreta).
 */
export function sessionTimeRange(session: Session): TimeRange | null {
  if (session.type === 'rest' || session.slot === 'ALL') return null

  const start =
    session.slot === 'PM' ? EVENING_START : session.type === 'crossfit' ? CROSSFIT_START : MORNING_START
  const end = start + DURATION_MIN[session.type] / 60

  return { start, end: Math.min(end, GRID_END_HOUR) }
}

/** True si la sesión va en la fila superior de "todo el día". */
export function isAllDay(session: Session): boolean {
  return sessionTimeRange(session) === null
}

/** Formatea una hora decimal como "6:30". */
export function formatHour(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Formatea un rango como "6:30 – 8:00". */
export function formatRange(range: TimeRange): string {
  return `${formatHour(range.start)} – ${formatHour(range.end)}`
}

const SLOT_TEXT: Record<Session['slot'], string> = {
  AM: 'Mañana',
  PM: 'Tarde',
  ALL: 'Todo el día',
}

/** Horario de una sesión: el rango si lo tiene, si no la franja ("Tarde"). */
export function scheduleLabel(session: Session): string {
  const range = sessionTimeRange(session)
  return range ? formatRange(range) : SLOT_TEXT[session.slot]
}

/** Etiqueta completa: "Mañana · 6:30 – 8:00", o sólo "Tarde" si no tiene hora. */
export function timingLabel(session: Session): string {
  const range = sessionTimeRange(session)
  return range ? `${SLOT_TEXT[session.slot]} · ${formatRange(range)}` : SLOT_TEXT[session.slot]
}

/** Hora actual en horas decimales, para la línea de "ahora" de la rejilla. */
export function currentHour(now = new Date()): number {
  return now.getHours() + now.getMinutes() / 60
}
