import type { PeriodDef, SchoolClass, SchoolSetup, TimetableSlot } from './schoolTypes'

/**
 * Semilla del horario — Grade 11, Colegio Colombo Británico (Cali), ciclo de 6 días.
 *
 * Esto es el punto de partida: mientras el usuario no haya guardado su propio horario
 * (`SchoolConfig.setup`) manda esta semilla, y desde «Colegio → Materias» él edita lo
 * que quiera sin tocar el código.
 *
 * Cuando el colegio emite un horario nuevo, se cambia aquí y se sube `VERSION_HORARIO`:
 * así también lo reciben los perfiles que ya tenían un horario guardado.
 */

/**
 * Día normal: lunes, martes, jueves y viernes. Salida 3:05 pm.
 *
 * Horario oficial de **Grados 10-12** (el colegio publica uno distinto para 6º-9º,
 * que almuerza a las 12:25 en vez de a la 1:20).
 */
export const DEFAULT_PERIODS: PeriodDef[] = [
  { period: 'Adv', start: '8:00', end: '8:10', kind: 'class' },
  { period: 'P1', start: '8:10', end: '9:05', kind: 'class' },
  { period: 'P2', start: '9:10', end: '10:05', kind: 'class' },
  { period: 'Recreo', start: '10:05', end: '10:30', kind: 'break' },
  { period: 'P3', start: '10:30', end: '11:25', kind: 'class' },
  { period: 'P4', start: '11:30', end: '12:25', kind: 'class' },
  { period: 'P5', start: '12:30', end: '13:20', kind: 'class' },
  { period: 'Almuerzo', start: '13:20', end: '14:10', kind: 'break' },
  { period: 'P6', start: '14:10', end: '15:05', kind: 'class' },
]

/**
 * Miércoles: horario corto, igual para todo el colegio (6º-12º). Un solo descanso,
 * clases de 40-45 min y salida a la **1:05 pm**.
 */
export const WEDNESDAY_PERIODS: PeriodDef[] = [
  { period: 'Adv', start: '8:00', end: '8:10', kind: 'class' },
  { period: 'P1', start: '8:10', end: '8:55', kind: 'class' },
  { period: 'P2', start: '9:00', end: '9:40', kind: 'class' },
  { period: 'P3', start: '9:45', end: '10:25', kind: 'class' },
  { period: 'Recreo', start: '10:25', end: '10:55', kind: 'break' },
  { period: 'P4', start: '10:55', end: '11:35', kind: 'class' },
  { period: 'P5', start: '11:40', end: '12:20', kind: 'class' },
  { period: 'P6', start: '12:25', end: '13:05', kind: 'class' },
]

/** Nombre visible de cada tipo de día, para la pantalla de edición. */
export const DAY_TYPE_LABELS: Record<string, string> = {
  normal: 'Día normal',
  miercoles: 'Miércoles (salida 1:05 pm)',
}

export const DEFAULT_PERIOD_SETS: Record<string, PeriodDef[]> = {
  normal: DEFAULT_PERIODS,
  miercoles: WEDNESDAY_PERIODS,
}

/** Índice 0 = lunes … 6 = domingo. */
export const DEFAULT_DAY_TYPE_BY_WEEKDAY: string[] = [
  'normal',
  'normal',
  'miercoles',
  'normal',
  'normal',
  'normal',
  'normal',
]

/**
 * Versión de la semilla del horario. Al subirla, un horario ya guardado se reemplaza
 * por esta semilla (ver `normalizeSetup` en `src/lib/school.ts`): sin eso, el horario
 * nuevo nunca le llegaría a quien ya tuviera su `setup` en la nube.
 */
export const VERSION_HORARIO = 2

/**
 * Materias que cambiaron de código al pasar al horario de 2026-2027 (SAS subió a HL,
 * Inglés bajó a SL, Business y Español cambiaron de grupo). Sirve para no perder las
 * unidades ya creadas y para reapuntar notas y tareas viejas.
 */
export const RENOMBRES_DE_CODIGO: Record<string, string> = {
  ESSSL2: 'ESSHL1',
  ENGAHL1: 'ENGASL1',
  BMHL2: 'BMHL3',
  ESPASL2: 'ESPASL1',
}

export const DEFAULT_CLASSES: Record<string, SchoolClass> = {
  ADV9: { code: 'ADV9', name: 'Advisory', teacher: 'FL', color: 'slate' },
  ESSHL1: { code: 'ESSHL1', name: 'SAS', teacher: 'NMR', color: 'cyan' },
  'MAA&ASL1': { code: 'MAA&ASL1', name: 'Matemáticas', teacher: 'TG', color: 'blue' },
  ECOHLSL2: { code: 'ECOHLSL2', name: 'Economía', teacher: 'RP', color: 'green' },
  ENGASL1: { code: 'ENGASL1', name: 'Inglés', teacher: 'HP', color: 'violet' },
  BMHL3: { code: 'BMHL3', name: 'Business', teacher: 'JDS', color: 'amber' },
  ESPASL1: { code: 'ESPASL1', name: 'Español', teacher: 'AMP', color: 'rose' },
  ICFES5: { code: 'ICFES5', name: 'ICFES', teacher: 'NMR/LP/SMI', color: 'fuchsia' },
  TOK2: { code: 'TOK2', name: 'TOK', teacher: 'PALL', color: 'indigo' },
  CIESOC6: { code: 'CIESOC6', name: 'Ciencias Sociales', teacher: 'AMM', color: 'teal' },
  SH7: { code: 'SH7', name: 'Study Hall', teacher: 'LNC', color: 'slate' },
}

function slot(period: string, classCode: string, room: string): TimetableSlot {
  return { period, classCode, room }
}

/**
 * DEFAULT_TIMETABLE[díaDeCiclo 1..6] = clases de ese día (Adv + P1..P6).
 *
 * Copiado del horario que emitió el colegio el 27/08/2026. En el Día 5 el colegio dejó
 * las dos últimas horas en blanco, pero él sigue teniendo Study Hall y Ciencias
 * Sociales ahí, con el mismo profesor y el mismo salón de siempre.
 */
export const DEFAULT_TIMETABLE: Record<number, TimetableSlot[]> = {
  1: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESPASL1', 'R8'),
    slot('P2', 'MAA&ASL1', 'R6'),
    slot('P3', 'ECOHLSL2', 'R1'),
    slot('P4', 'ADV9', 'R24'),
    slot('P5', 'BMHL3', 'R13'),
    slot('P6', 'ESSHL1', 'Lab2'),
  ],
  2: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESSHL1', 'Lab6'),
    slot('P2', 'ICFES5', 'Lab5'),
    slot('P3', 'BMHL3', 'R13'),
    slot('P4', 'ECOHLSL2', 'R1'),
    slot('P5', 'ENGASL1', 'R6'),
    slot('P6', 'MAA&ASL1', 'R5'),
  ],
  3: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'BMHL3', 'R13'),
    slot('P2', 'ECOHLSL2', 'R1'),
    slot('P3', 'ESSHL1', 'Lab6'),
    slot('P4', 'ESPASL1', 'R10'),
    slot('P5', 'MAA&ASL1', 'R6'),
    slot('P6', 'ENGASL1', 'R8'),
  ],
  4: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESSHL1', 'Lab2'),
    slot('P2', 'ESPASL1', 'R10'),
    slot('P3', 'ECOHLSL2', 'R1'),
    slot('P4', 'ENGASL1', 'R6'),
    slot('P5', 'TOK2', 'R2'),
    slot('P6', 'BMHL3', 'R1'),
  ],
  5: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESSHL1', 'Lab2'),
    slot('P2', 'BMHL3', 'R13'),
    slot('P3', 'MAA&ASL1', 'R6'),
    slot('P4', 'ECOHLSL2', 'R1'),
    slot('P5', 'SH7', ''),
    slot('P6', 'CIESOC6', 'R1'),
  ],
  6: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ENGASL1', 'R7'),
    slot('P2', 'ECOHLSL2', 'R1'),
    slot('P3', 'BMHL3', 'R13'),
    slot('P4', 'ESSHL1', 'Lab2'),
    slot('P5', 'TOK2', 'R3'),
    slot('P6', 'ESPASL1', 'R9'),
  ],
}

export const DEFAULT_SETUP: SchoolSetup = {
  version: VERSION_HORARIO,
  periodSets: DEFAULT_PERIOD_SETS,
  dayTypeByWeekday: DEFAULT_DAY_TYPE_BY_WEEKDAY,
  classes: DEFAULT_CLASSES,
  timetable: DEFAULT_TIMETABLE,
}
