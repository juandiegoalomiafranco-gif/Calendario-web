/**
 * Motor de plan: genera el `DayPlan` de cualquier fecha a partir del programa
 * (`src/data/program.ts`), los días históricos escritos a mano
 * (`src/data/legacyPlan.ts`), los festivos y la meta activa.
 *
 * Es lógica pura y sin dependencias de React o Supabase, para poder probarla.
 *
 * Orden de las reglas: día histórico > semana tipo + progresión > meta > festivo.
 */
import type { DayPlan, Session } from '../data/types'
import { LEGACY_DAYS } from '../data/legacyPlan'
import {
  PROGRAM_START,
  PROGRESSION,
  WEEK_TEMPLATE,
  floorHalfKm,
  goalRun,
  restPM,
  roundHalfKm,
  shakeoutRun,
  type DayContext,
} from '../data/program'
import { holidayName } from '../data/holidays'
import { addDays, daysBetween, weekStart, weekdayIndex, weekdayName } from './dates'

/** Lo que el motor necesita saber de una meta (una `Goal` encaja tal cual). */
export interface PlanGoal {
  title: string
  targetDate: string
  targetKm?: number
}

/** Tope de seguridad para no generar rangos absurdos por un parámetro malo. */
const MAX_RANGE_DAYS = 400

/** Semanas completas transcurridas desde el arranque del programa. */
export function weekIndexOf(date: string): number {
  return Math.max(0, Math.floor(daysBetween(weekStart(PROGRAM_START), weekStart(date)) / 7))
}

function progressiveKm(base: number, increase: number, max: number, weekIndex: number): number {
  return Math.min(max, base * Math.pow(1 + increase, weekIndex))
}

export function dayContext(date: string, goal?: PlanGoal): DayContext {
  const weekIndex = weekIndexOf(date)
  const isDeload = (weekIndex + 1) % PROGRESSION.deloadEvery === 0

  let longRunKm = progressiveKm(
    PROGRESSION.longRunBaseKm,
    PROGRESSION.longRunIncrease,
    PROGRESSION.longRunMaxKm,
    weekIndex,
  )
  let easyRunKm = progressiveKm(
    PROGRESSION.easyRunBaseKm,
    PROGRESSION.easyRunIncrease,
    PROGRESSION.easyRunMaxKm,
    weekIndex,
  )

  if (isDeload) {
    longRunKm *= PROGRESSION.deloadFactor
    easyRunKm *= PROGRESSION.deloadFactor
  }

  // Nunca se corre la distancia completa del objetivo antes del día clave. El
  // tope se aplica ya redondeado, para que el redondeo no lo sobrepase.
  let cap: number | null = null

  if (goal?.targetKm) {
    const daysToGoal = daysBetween(date, goal.targetDate)
    if (daysToGoal > 0) {
      cap = floorHalfKm(goal.targetKm * PROGRESSION.goalCapRatio)
      if (daysToGoal <= PROGRESSION.taperDays) {
        longRunKm *= PROGRESSION.taperFactor
        easyRunKm *= PROGRESSION.taperFactor
      }
    }
  }

  const longRun = cap === null ? roundHalfKm(longRunKm) : Math.min(roundHalfKm(longRunKm), cap)

  return {
    date,
    weekIndex,
    isDeload,
    longRunKm: longRun,
    easyRunKm: Math.min(roundHalfKm(easyRunKm), longRun),
  }
}

function generateDay(date: string, goal?: PlanGoal): DayPlan {
  const build = WEEK_TEMPLATE[weekdayIndex(date)]
  return { date, weekday: weekdayName(date), sessions: build(dayContext(date, goal)) }
}

/** El día de la meta y su víspera se reescriben alrededor del objetivo. */
function applyGoal(day: DayPlan, goal?: PlanGoal): DayPlan {
  if (!goal) return day
  const daysToGoal = daysBetween(day.date, goal.targetDate)

  if (daysToGoal === 0) {
    if (!goal.targetKm) {
      return { ...day, note: `🎯 Hoy es tu meta: ${goal.title}.` }
    }
    return {
      ...day,
      note: `🎯 Hoy es tu meta: ${goal.title}. Hoy no toca nada más.`,
      sessions: [
        goalRun(`${day.date}-goal`, goal.targetKm, goal.title),
        restPM(`${day.date}-pm`, 'Descanso total — te lo ganaste'),
      ],
    }
  }

  // Víspera: piernas activadas, pero sin gastar nada.
  const esDescansoTotal = day.sessions.every((s) => s.type === 'rest')
  if (daysToGoal === 1 && goal.targetKm && !esDescansoTotal) {
    return {
      ...day,
      note: `Mañana es tu meta: ${goal.title}. Hoy toca guardar energía.`,
      sessions: [
        shakeoutRun(`${day.date}-am`, '3–4', 3.5),
        restPM(`${day.date}-pm`, 'Descanso / movilidad suave'),
      ],
    }
  }

  return day
}

/** En festivo el gimnasio cierra: el funcional (con entrenador) pasa a descanso. */
function applyHolidays(day: DayPlan): DayPlan {
  const name = holidayName(day.date)
  if (!name) return day

  const hasFuncional = day.sessions.some((s) => s.type === 'crossfit')
  const sessions = day.sessions.map<Session>((s) =>
    s.type === 'crossfit'
      ? {
          id: s.id,
          slot: s.slot,
          type: 'rest',
          title: 'Descanso (festivo)',
          summary: 'Descanso',
          why: 'Hoy es festivo y el gimnasio cierra, así que el funcional se cambia por descanso: foam roller, estiramiento suave o simplemente recuperar. No agregues carga nueva.',
        }
      : s,
  )
  const note = hasFuncional
    ? `Festivo (${name}): el gimnasio cierra, el funcional se cambia por descanso.`
    : (day.note ?? `Festivo: ${name}.`)

  return { ...day, sessions, note }
}

/** El plan de un día cualquiera. */
export function buildDay(date: string, goal?: PlanGoal): DayPlan {
  const legacy = LEGACY_DAYS[date]
  // Los días históricos no se tocan: son la clave del registro ya guardado.
  const base = legacy ?? applyGoal(generateDay(date, goal), goal)
  return applyHolidays(base)
}

/** El plan de un rango de fechas, ambos extremos incluidos. */
export function buildRange(fromIso: string, toIso: string, goal?: PlanGoal): DayPlan[] {
  const total = daysBetween(fromIso, toIso)
  if (total < 0) return []

  const days: DayPlan[] = []
  for (let i = 0; i <= Math.min(total, MAX_RANGE_DAYS); i++) {
    days.push(buildDay(addDays(fromIso, i), goal))
  }
  return days
}
