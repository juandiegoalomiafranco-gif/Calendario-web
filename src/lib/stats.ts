import type { DayPlan, LogEntry, Session, SessionType } from '../data/types'

export type Category = 'running' | 'natacion' | 'funcional' | 'futbol' | 'voley' | 'flex' | 'descanso'

const RUNNING_TYPES: SessionType[] = ['running-easy', 'running-long', 'running-shakeout', 'running-goal']
const SWIM_TYPES: SessionType[] = ['swim-technique', 'swim-endurance']

export function isRunning(type: SessionType): boolean {
  return RUNNING_TYPES.includes(type)
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
