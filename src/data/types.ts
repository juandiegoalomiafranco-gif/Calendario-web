export type SessionType =
  | 'crossfit'
  | 'running-easy'
  | 'running-long'
  | 'running-shakeout'
  | 'running-goal'
  | 'swim-technique'
  | 'swim-endurance'
  | 'flex'
  | 'rest'

export type Slot = 'AM' | 'PM' | 'ALL'

export interface Session {
  id: string
  slot: Slot
  type: SessionType
  title: string
  summary: string
  distanceKm?: string
  /** Distancia del plan como número, cuando la genera el motor. */
  plannedKm?: number
  pace?: string
  /** Cómo debe sentirse la sesión (reemplaza a la vieja prescripción por pulsaciones). */
  effort?: string
  structure?: string[]
  why: string
  selfRegulation?: string
  flexOptions?: string[]
}

export interface DayPlan {
  date: string // YYYY-MM-DD
  weekday: string
  sessions: Session[]
  note?: string
}

export type FlexActivity = 'futbol' | 'voley' | 'natacion'

export interface LogEntry {
  completed: boolean
  distanceKm?: number
  durationMin?: number
  calories?: number
  activity?: FlexActivity
  feeling?: 'genial' | 'bien' | 'regular' | 'cargado'
  notes?: string
}

export type GoalSport = 'running' | 'natacion' | 'funcional'

export interface Goal {
  id: string
  title: string
  sport: GoalSport
  /** Distancia objetivo en km. Opcional: hay metas que solo son una fecha. */
  targetKm?: number
  targetDate: string // YYYY-MM-DD
  achieved: boolean
  createdAt: string
}
