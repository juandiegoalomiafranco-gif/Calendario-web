export type Urgency = 'urgente' | 'normal' | 'puede_esperar'

export interface SchoolClass {
  code: string
  name: string
  teacher: string
  /** Clase de color Tailwind para el punto/píldora (p. ej. 'bg-sky-500'). */
  color: string
  /** Color de texto sobre el color de fondo. */
  text: string
}

export interface TimetableSlot {
  period: string // 'Adv', 'P1'..'P6'
  start: string
  end: string
  classCode: string
  room: string
}

/** Configuración del ciclo de 6 días. El ciclo avanza SOLO en días de colegio. */
export interface SchoolConfig {
  anchorDate: string // YYYY-MM-DD
  anchorDay: number // 1..6
  /** Reinicios: en `date` el ciclo pasa a ser `day`, y desde ahí sigue contando. */
  overrides: { date: string; day: number }[]
}

export interface ClassNote {
  id: string
  classCode: string
  date: string // YYYY-MM-DD
  unit: string // tema / unidad para agrupar
  title: string
  notebookPage: string // página del cuaderno físico
  body: string
  important: boolean
}

export interface SchoolTask {
  id: string
  classCode?: string
  title: string
  detail?: string
  dueDate?: string // YYYY-MM-DD
  urgency: Urgency
  done: boolean
}

export const URGENCY_META: Record<Urgency, { label: string; color: string; dot: string }> = {
  urgente: { label: 'Urgente', color: 'bg-brand-600 text-white', dot: 'bg-brand-600' },
  normal: { label: 'Normal', color: 'bg-amber-500 text-ink-900', dot: 'bg-amber-500' },
  puede_esperar: { label: 'Puede esperar', color: 'bg-ink-200 text-ink-800', dot: 'bg-ink-400' },
}
