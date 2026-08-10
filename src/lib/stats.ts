import type { DayPlan, LogEntry, Session, SessionType } from '../data/types'
import { chunkIntoWeeks } from './weeks'
import { weekdayIndex } from './dates'

export type Category = 'running' | 'natacion' | 'funcional' | 'futbol' | 'voley' | 'flex' | 'descanso'

const RUNNING_TYPES: SessionType[] = ['running-easy', 'running-long', 'running-shakeout', 'running-goal']
const SWIM_TYPES: SessionType[] = ['swim-technique', 'swim-endurance']

export function isRunning(type: SessionType): boolean {
  return RUNNING_TYPES.includes(type)
}

export function isDistanceSession(type: SessionType): boolean {
  return isRunning(type) || SWIM_TYPES.includes(type) || type === 'flex'
}

export function parsePlannedDistance(value?: string): number {
  if (!value) return 0
  const nums = value.match(/\d+(\.\d+)?/g)
  if (!nums || nums.length === 0) return 0
  const parsed = nums.map(Number)
  return parsed.reduce((a, b) => a + b, 0) / parsed.length
}

/** Minutos decimales como "m:ss" — el ritmo se escribe igual en toda la app. */
export function formatMinutes(value: number): string {
  const minutes = Math.floor(value)
  const seconds = Math.round((value - minutes) * 60)
  const mm = seconds === 60 ? minutes + 1 : minutes
  const ss = seconds === 60 ? 0 : seconds
  return `${mm}:${String(ss).padStart(2, '0')}`
}

/** Ritmo (min/km) a partir de distancia y duración, como "m:ss /km". */
export function formatPace(km?: number, durationMin?: number): string | null {
  if (!km || !durationMin || km <= 0 || durationMin <= 0) return null
  return `${formatMinutes(durationMin / km)} /km`
}

export function sessionCategory(session: Session, entry?: LogEntry): Category {
  if (isRunning(session.type)) return 'running'
  if (SWIM_TYPES.includes(session.type)) return 'natacion'
  if (session.type === 'crossfit') return 'funcional'
  if (session.type === 'rest') return 'descanso'
  if (entry?.activity === 'futbol') return 'futbol'
  if (entry?.activity === 'voley') return 'voley'
  if (entry?.activity === 'natacion') return 'natacion'
  return 'flex'
}

/** Km que el plan propone para una sesión. */
export function plannedKmOf(session: Session): number {
  return session.plannedKm ?? parsePlannedDistance(session.distanceKm)
}

/**
 * Km que aporta una sesión al total: los km ingresados por el usuario tal cual;
 * si no ingresó nada, el estimado del plan (marcado como `estimated`).
 */
export function kmForEntry(session: Session, entry?: LogEntry): { km: number; estimated: boolean } {
  if (!entry?.completed) return { km: 0, estimated: false }
  if (entry.distanceKm != null) return { km: entry.distanceKm, estimated: false }
  const planned = plannedKmOf(session)
  return { km: planned, estimated: planned > 0 }
}

/** Km completados agrupados por categoría de actividad. */
export function kmByCategory(sessions: Session[], log: Record<string, LogEntry>): Map<Category, number> {
  const m = new Map<Category, number>()
  for (const s of sessions) {
    const entry = log[s.id]
    if (!entry?.completed) continue
    const { km } = kmForEntry(s, entry)
    if (km <= 0) continue
    const cat = sessionCategory(s, entry)
    m.set(cat, (m.get(cat) ?? 0) + km)
  }
  return m
}

/**
 * Racha de días con al menos una sesión (no descanso) completada.
 * Los días de solo descanso no rompen la racha; el día de hoy sin completar tampoco.
 */
export function computeStreaks(
  plan: DayPlan[],
  log: Record<string, LogEntry>,
  todayIso: string,
): { current: number; best: number } {
  const days = plan.filter((d) => d.date <= todayIso && d.sessions.some((s) => s.type !== 'rest'))
  const hits = days.map((d) => d.sessions.some((s) => s.type !== 'rest' && log[s.id]?.completed))

  let best = 0
  let run = 0
  for (const hit of hits) {
    run = hit ? run + 1 : 0
    best = Math.max(best, run)
  }

  let current = 0
  for (let i = hits.length - 1; i >= 0; i--) {
    if (hits[i]) current++
    else if (days[i].date === todayIso) continue
    else break
  }

  return { current, best }
}

// --- Resúmenes para la pantalla de Progreso ----------------------------------
// Vivían dentro de `Progress.tsx` en ~15 `useMemo`; aquí se pueden probar.

export type LogMap = Record<string, LogEntry>

/** Una sesión del plan junto con el día al que pertenece. */
export type DatedSession = Session & { date: string }

export function flattenSessions(days: DayPlan[]): DatedSession[] {
  return days.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date })))
}

export interface Summary {
  sessions: DatedSession[]
  /** Sesiones que son entrenamiento (los descansos no cuentan para el cumplimiento). */
  trainings: DatedSession[]
  completedTrainings: number
  completedRests: number
  completionPct: number
  km: { total: number; registered: number; estimated: number; running: number; longestRun: number }
  totals: { durationMin: number; calories: number }
  /** `false` cuando no hay ni una sesión registrada: la pantalla debe mostrar el estado vacío. */
  hasAnyLog: boolean
}

export function summarize(days: DayPlan[], log: LogMap): Summary {
  const sessions = flattenSessions(days)
  const trainings = sessions.filter((s) => s.type !== 'rest')
  const rests = sessions.filter((s) => s.type === 'rest')

  const completedTrainings = trainings.filter((s) => log[s.id]?.completed).length
  const completedRests = rests.filter((s) => log[s.id]?.completed).length

  let total = 0
  let registered = 0
  let estimated = 0
  let running = 0
  let longestRun = 0
  let durationMin = 0
  let calories = 0

  for (const s of sessions) {
    const r = kmForEntry(s, log[s.id])
    total += r.km
    if (r.estimated) estimated += r.km
    else registered += r.km
    if (isRunning(s.type)) {
      running += r.km
      longestRun = Math.max(longestRun, r.km)
    }
    const entry = log[s.id]
    if (entry?.completed) {
      durationMin += entry.durationMin ?? 0
      calories += entry.calories ?? 0
    }
  }

  return {
    sessions,
    trainings,
    completedTrainings,
    completedRests,
    completionPct: trainings.length ? Math.round((completedTrainings / trainings.length) * 100) : 0,
    km: { total, registered, estimated, running, longestRun },
    totals: { durationMin, calories },
    hasAnyLog: sessions.some((s) => log[s.id]?.completed),
  }
}

export interface WeekSummary {
  label: string
  /** Lunes de esa semana, para enlazar a la vista de Semana. */
  start: string
  km: number
  completionPct: number
  /** La semana en curso no está terminada: no se compara contra las anteriores. */
  inProgress: boolean
}

/**
 * Resumen por semana, numeradas desde el arranque del programa y quedándose con
 * las últimas `limit` (el plan es infinito; la vista no).
 */
export function weekSummaries(days: DayPlan[], log: LogMap, todayIso: string, limit: number): WeekSummary[] {
  const all = chunkIntoWeeks(days)
  const from = Math.max(0, all.length - limit)

  return all.slice(from).map((week, i) => {
    const sessions = week.flatMap((d) => d.sessions)
    const trainings = sessions.filter((s) => s.type !== 'rest')
    const done = trainings.filter((s) => log[s.id]?.completed).length
    const last = week[week.length - 1]

    return {
      label: `Sem ${from + i + 1}`,
      start: week[0].date,
      km: sessions.reduce((sum, s) => sum + kmForEntry(s, log[s.id]).km, 0),
      completionPct: trainings.length ? Math.round((done / trainings.length) * 100) : 0,
      // Solo puede estar en curso la semana que termina hoy, y no si hoy es domingo.
      inProgress: last.date === todayIso && weekdayIndex(todayIso) !== 0,
    }
  })
}

/**
 * Km de la última semana **terminada** y su diferencia con la anterior. Comparar
 * la semana en curso contra una entera siempre daba un resultado negativo falso.
 */
export function lastFinishedWeekDelta(weeks: WeekSummary[]): { last: number; delta: number } | null {
  const finished = weeks.filter((w) => !w.inProgress && w.km > 0)
  if (finished.length < 2) return null
  const last = finished[finished.length - 1].km
  const prev = finished[finished.length - 2].km
  return { last, delta: last - prev }
}

export interface TrendPoint {
  label: string
  value: number
  to: string
}

/** Distancia y ritmo de cada carrera completada, en orden cronológico. */
export function runTrends(sessions: DatedSession[], log: LogMap): { distance: TrendPoint[]; pace: TrendPoint[] } {
  const runs = sessions
    .filter((s) => isRunning(s.type) && log[s.id]?.completed)
    .sort((a, b) => a.date.localeCompare(b.date))

  const distance: TrendPoint[] = []
  const pace: TrendPoint[] = []

  for (const s of runs) {
    const km = kmForEntry(s, log[s.id]).km
    // `from` viaja en la URL porque un ancla dentro del SVG no puede llevar
    // estado de router; así el detalle sabe volver a Progreso.
    const to = `/dia/${s.date}?from=/progreso`
    const label = `${s.date.slice(8, 10)}/${s.date.slice(5, 7)}`
    if (km > 0) distance.push({ label, value: km, to })
    const duration = log[s.id]?.durationMin
    if (km > 0 && duration) pace.push({ label, value: duration / km, to })
  }

  return { distance, pace }
}

/** Carreras completadas con distancia y su promedio. */
export function runStats(sessions: DatedSession[], log: LogMap): { count: number; avgPerRun: number } {
  const kms = sessions
    .filter((s) => isRunning(s.type) && log[s.id]?.completed)
    .map((s) => kmForEntry(s, log[s.id]).km)
    .filter((v) => v > 0)
  const totalKm = kms.reduce((a, b) => a + b, 0)
  return { count: kms.length, avgPerRun: kms.length ? totalKm / kms.length : 0 }
}
