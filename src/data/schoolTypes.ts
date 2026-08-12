import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import { COLORS, type ColorKey, type ColorStyles } from './palette'

export type Urgency = 'urgente' | 'normal' | 'puede_esperar'

/** Qué es cada cosa que se agenda en una clase. */
export type TaskKind = 'tarea' | 'examen' | 'quiz' | 'entrega'

export interface SchoolClass {
  code: string
  name: string
  teacher: string
  /** Clave de la paleta compartida (`src/data/palette.ts`). */
  color: ColorKey
}

/** Un periodo del día: su nombre, su horario y si es clase o descanso. */
export interface PeriodDef {
  period: string // 'Adv', 'P1'..'P6', 'Recreo', 'Almuerzo'
  start: string // '8:10'
  end: string // '9:05'
  kind: 'class' | 'break'
}

/** Qué materia y en qué salón va un periodo concreto de un día del ciclo. */
export interface TimetableSlot {
  period: string
  classCode: string
  room: string
}

/**
 * Horario completo y editable: los periodos del día, las materias y qué va en cada
 * periodo de cada uno de los 6 días del ciclo. Se siembra con el horario real de
 * Juan Diego y a partir de ahí se edita desde la app.
 */
export interface SchoolSetup {
  periods: PeriodDef[]
  classes: Record<string, SchoolClass>
  timetable: Record<number, TimetableSlot[]>
}

/** Configuración del ciclo de 6 días. El ciclo avanza SOLO en días de colegio. */
export interface SchoolConfig {
  anchorDate: string // YYYY-MM-DD
  anchorDay: number // 1..6
  /** Reinicios: en `date` el ciclo pasa a ser `day`, y desde ahí sigue contando. */
  overrides: { date: string; day: number }[]
  /** Materias y horario editables. Si falta, se usa la semilla. */
  setup?: SchoolSetup
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
  kind: TaskKind
  done: boolean
}

export const URGENCY_META: Record<Urgency, { label: string; color: ColorStyles }> = {
  urgente: { label: 'Urgente', color: COLORS.rose },
  normal: { label: 'Normal', color: COLORS.amber },
  puede_esperar: { label: 'Puede esperar', color: COLORS.slate },
}

export const TASK_KIND_META: Record<
  TaskKind,
  { label: string; Icon: LucideIcon; color: ColorStyles }
> = {
  tarea: { label: 'Tarea', Icon: ClipboardCheck, color: COLORS.blue },
  examen: { label: 'Examen', Icon: GraduationCap, color: COLORS.rose },
  quiz: { label: 'Quiz', Icon: FileText, color: COLORS.violet },
  entrega: { label: 'Entrega', Icon: BookOpen, color: COLORS.teal },
}

export const TASK_KIND_ORDER: TaskKind[] = ['tarea', 'examen', 'quiz', 'entrega']
export const URGENCY_ORDER: Urgency[] = ['urgente', 'normal', 'puede_esperar']
