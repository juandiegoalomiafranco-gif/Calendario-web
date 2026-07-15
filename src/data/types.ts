export type SessionType =
  | 'crossfit'
  | 'running-easy'
  | 'running-long'
  | 'running-shakeout'
  | 'running-goal'
  | 'swim-technique'
  | 'swim-endurance'
  | 'futbol'
  | 'voley'
  | 'flex'
  | 'rest'

export type Slot = 'AM' | 'PM' | 'ALL'

export interface Session {
  id: string
  slot: Slot
  type: SessionType
  title: string
  summary: string
  fixed?: boolean
  focus?: string
  distanceKm?: string
  pace?: string
  hrTarget?: string
  structure?: string[]
  why: string
  selfRegulation?: string
  flexOptions?: string[]
}

export interface Recovery {
  title: string
  detail: string
}

export interface DayPlan {
  date: string // YYYY-MM-DD
  weekday: string
  sessions: Session[]
  recovery?: Recovery
  note?: string
}

export type CustomKind = 'futbol' | 'voley'

export interface CustomActivity {
  id: string // custom-${timestamp}
  date: string // YYYY-MM-DD
  kind: CustomKind
  slot: Slot
  note?: string
}

export interface LogEntry {
  completed: boolean
  avgHr?: number
  distanceKm?: number
  feeling?: 'genial' | 'bien' | 'regular' | 'cargado'
  notes?: string
}
