import {
  BookOpen,
  Brush,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  ShoppingCart,
  Sparkles,
  Users,
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
  /**
   * Unidades o temas de la materia. Se van creando desde el formulario de nota y
   * quedan guardadas aquí, para no volver a escribir «Derivadas» en cada nota y
   * para poder filtrar las notas por unidad.
   */
  units?: string[]
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
 * Horario completo y editable.
 *
 * En el CCB las MATERIAS salen del día del ciclo (1..6) pero las HORAS salen del día
 * de la semana: el miércoles se sale a la 1:00 pm y solo hay un recreo. Por eso hay
 * varios juegos de horas (`periodSets`) y un mapa de qué juego usa cada día de la
 * semana. Se siembra con el horario real de Juan Diego y desde ahí se edita en la app.
 */
export interface SchoolSetup {
  /** Juegos de horas por tipo de día: 'normal', 'miercoles', … */
  periodSets: Record<string, PeriodDef[]>
  /** Qué juego de horas usa cada día. Índice 0 = lunes … 6 = domingo. */
  dayTypeByWeekday: string[]
  classes: Record<string, SchoolClass>
  timetable: Record<number, TimetableSlot[]>
}

/** Forma antigua (un solo juego de horas), para poder leer lo ya guardado. */
export interface LegacySchoolSetup {
  periods?: PeriodDef[]
  periodSets?: Record<string, PeriodDef[]>
  dayTypeByWeekday?: string[]
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
  /**
   * Días sin clase añadidos a mano, para los que el colegio anuncia sobre la marcha
   * y no están en el calendario oficial. Congelan el ciclo igual que un festivo.
   */
  noClassDays: string[]
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

/** De dónde sale el pendiente: del colegio o de la vida en la casa. */
export type TaskScope = 'colegio' | 'personal'

/** Áreas de los pendientes personales, para no mezclarlo todo en una lista. */
export type PersonalArea = 'casa' | 'familia' | 'salud' | 'compras' | 'papeleo' | 'amigos' | 'otro'

/**
 * Un pendiente, sea del colegio o de la casa. Los dos viven en la misma tabla para
 * que el calendario, «Hoy» y Pendientes tengan un único origen de datos: lo que se
 * programa desde una clase aparece solo en todas partes.
 */
export interface Task {
  id: string
  scope: TaskScope
  /** Solo en los del colegio. */
  classCode?: string
  /** Solo en los personales. */
  area?: PersonalArea
  title: string
  detail?: string
  dueDate?: string // YYYY-MM-DD
  /** Grado de importancia. Aplica a los dos tipos. */
  urgency: Urgency
  kind: TaskKind
  done: boolean
}

/** Nombre anterior, mientras quede código que lo use. */
export type SchoolTask = Task

export const PERSONAL_AREA_META: Record<
  PersonalArea,
  { label: string; Icon: LucideIcon; color: ColorStyles }
> = {
  casa: { label: 'Casa', Icon: House, color: COLORS.amber },
  familia: { label: 'Familia', Icon: Users, color: COLORS.rose },
  salud: { label: 'Salud', Icon: HeartPulse, color: COLORS.teal },
  compras: { label: 'Compras', Icon: ShoppingCart, color: COLORS.green },
  papeleo: { label: 'Papeleo', Icon: Landmark, color: COLORS.blue },
  amigos: { label: 'Amigos', Icon: Sparkles, color: COLORS.violet },
  otro: { label: 'Otro', Icon: Brush, color: COLORS.slate },
}

export const PERSONAL_AREA_ORDER: PersonalArea[] = [
  'casa',
  'familia',
  'salud',
  'compras',
  'papeleo',
  'amigos',
  'otro',
]

/** Grado de importancia. Sirve igual para una entrega del colegio y para algo de casa. */
export const URGENCY_META: Record<Urgency, { label: string; color: ColorStyles }> = {
  urgente: { label: 'Alta', color: COLORS.rose },
  normal: { label: 'Media', color: COLORS.amber },
  puede_esperar: { label: 'Baja', color: COLORS.slate },
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
