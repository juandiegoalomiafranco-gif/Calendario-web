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
  /**
   * Distancia del plan **solo como número**: "5", "10–11", "~0.6–0.7".
   * Nunca lleva la unidad dentro — la pone quien la pinta.
   */
  distanceKm?: string
  /** La misma distancia como número, para los cálculos. */
  plannedKm?: number
  pace?: string
  /** Cómo debe sentirse la sesión (reemplaza a la vieja prescripción por pulsaciones). */
  effort?: string
  structure?: string[]
  why: string
  selfRegulation?: string
  flexOptions?: string[]
  /** En los días flexibles, el entrenamiento que sustituye al deporte si no juegas. */
  alternative?: Session
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
  /** Cuándo se guardó, para decidir quién gana al fusionar con la nube. */
  updatedAt?: string
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
