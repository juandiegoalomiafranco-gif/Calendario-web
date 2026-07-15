import type { LogEntry } from '../../data/types'
import { PLAN, todayISO } from '../../data/plan'

export type LogMap = Record<string, LogEntry>

export function parseDistance(value?: string): number {
  if (!value) return 0
  const nums = value.match(/\d+(\.\d+)?/g)
  if (!nums || nums.length === 0) return 0
  const parsed = nums.map(Number)
  return parsed.reduce((a, b) => a + b, 0) / parsed.length
}

export interface PlanStats {
  completedCount: number
  totalPlanned: number
  completionPct: number
  kmDone: number
  streak: number
  weeks: { label: string; completed: number; total: number }[]
}

export function computePlanStats(log: LogMap): PlanStats {
  const iso = todayISO()
  const allSessions = PLAN.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date })))
  const pastOrToday = allSessions.filter((s) => s.date <= iso)

  const completedCount = pastOrToday.filter((s) => log[s.id]?.completed).length
  const totalPlanned = pastOrToday.length
  const completionPct = totalPlanned ? Math.round((completedCount / totalPlanned) * 100) : 0

  const kmDone = allSessions.reduce((sum, s) => {
    const entry = log[s.id]
    if (!entry?.completed) return sum
    return sum + (entry.distanceKm ?? parseDistance(s.distanceKm))
  }, 0)

  // Racha: días consecutivos hasta hoy en que el día fue solo-descanso
  // o tuvo al menos una sesión no-descanso completada. Hoy sin registrar
  // todavía no rompe la racha.
  const pastDays = PLAN.filter((d) => d.date <= iso).reverse()
  let streak = 0
  for (let i = 0; i < pastDays.length; i++) {
    const day = pastDays[i]
    const nonRest = day.sessions.filter((s) => s.type !== 'rest')
    const done = nonRest.length === 0 || nonRest.some((s) => log[s.id]?.completed)
    if (done) streak++
    else if (i === 0 && day.date === iso) continue
    else break
  }

  const weekMap = new Map<string, { label: string; completed: number; total: number }>()
  for (const s of pastOrToday) {
    const weekLabel = s.date.slice(0, 7) + '-' + String(Math.ceil(Number(s.date.slice(8, 10)) / 7))
    const bucket = weekMap.get(weekLabel) ?? { label: weekLabel, completed: 0, total: 0 }
    bucket.total += 1
    if (log[s.id]?.completed) bucket.completed += 1
    weekMap.set(weekLabel, bucket)
  }

  return { completedCount, totalPlanned, completionPct, kmDone, streak, weeks: Array.from(weekMap.values()) }
}
