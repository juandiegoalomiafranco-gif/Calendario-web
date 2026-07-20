import type { DayPlan, LogEntry, Session, SessionType } from '../data/types'

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

/** Ritmo (min/km) a partir de distancia y duración, como "m:ss /km". */
export function formatPace(km?: number, durationMin?: number): string | null {
  if (!km || !durationMin || km <= 0 || durationMin <= 0) return null
  const paceMin = durationMin / km
  const minutes = Math.floor(paceMin)
  const seconds = Math.round((paceMin - minutes) * 60)
  const mm = seconds === 60 ? minutes + 1 : minutes
  const ss = seconds === 60 ? 0 : seconds
  return `${mm}:${String(ss).padStart(2, '0')} /km`
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

/**
 * Km que aporta una sesión al total: los km ingresados por el usuario tal cual;
 * si no ingresó nada, el estimado del plan (marcado como `estimated`).
 */
export function kmForEntry(session: Session, entry?: LogEntry): { km: number; estimated: boolean } {
  if (!entry?.completed) return { km: 0, estimated: false }
  if (entry.distanceKm != null) return { km: entry.distanceKm, estimated: false }
  const planned = parsePlannedDistance(session.distanceKm)
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
