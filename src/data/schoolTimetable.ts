import type { PeriodDef, SchoolClass, SchoolSetup, TimetableSlot } from './schoolTypes'

/**
 * Semilla del horario — Grade 11, Colegio Colombo Británico (Cali), ciclo de 6 días.
 *
 * Esto es sólo el punto de partida: en el primer arranque se copia a la configuración
 * del usuario (`SchoolConfig.setup`) y a partir de ahí Juan Diego edita materias y
 * horario desde la app, sin tocar el código. Al empezar un año electivo nuevo basta
 * con editarlo desde «Colegio → Materias».
 */

export const DEFAULT_PERIODS: PeriodDef[] = [
  { period: 'Adv', start: '8:00', end: '8:10', kind: 'class' },
  { period: 'P1', start: '8:10', end: '9:05', kind: 'class' },
  { period: 'P2', start: '9:10', end: '10:05', kind: 'class' },
  { period: 'Recreo', start: '10:05', end: '10:28', kind: 'break' },
  { period: 'P3', start: '10:30', end: '11:25', kind: 'class' },
  { period: 'P4', start: '11:30', end: '12:25', kind: 'class' },
  { period: 'P5', start: '12:30', end: '13:20', kind: 'class' },
  { period: 'Almuerzo', start: '13:20', end: '14:05', kind: 'break' },
  { period: 'P6', start: '14:10', end: '15:05', kind: 'class' },
]

export const DEFAULT_CLASSES: Record<string, SchoolClass> = {
  ADV9: { code: 'ADV9', name: 'Advisory', teacher: 'FL', color: 'slate' },
  ESSSL2: { code: 'ESSSL2', name: 'SAS', teacher: 'NMR', color: 'cyan' },
  'MAA&ASL1': { code: 'MAA&ASL1', name: 'Matemáticas', teacher: 'TG', color: 'blue' },
  ECOHLSL2: { code: 'ECOHLSL2', name: 'Economía', teacher: 'RP', color: 'green' },
  ENGAHL1: { code: 'ENGAHL1', name: 'Inglés', teacher: 'SM', color: 'violet' },
  BMHL2: { code: 'BMHL2', name: 'Business', teacher: 'JDS', color: 'amber' },
  ESPASL2: { code: 'ESPASL2', name: 'Español', teacher: 'RV', color: 'rose' },
  ICFES5: { code: 'ICFES5', name: 'ICFES', teacher: 'NMR/LP/SMI', color: 'fuchsia' },
  TOK2: { code: 'TOK2', name: 'TOK', teacher: 'PALL', color: 'indigo' },
  CIESOC6: { code: 'CIESOC6', name: 'Ciencias Sociales', teacher: 'AMM', color: 'teal' },
  SH7: { code: 'SH7', name: 'Study Hall', teacher: 'LNC', color: 'slate' },
}

function slot(period: string, classCode: string, room: string): TimetableSlot {
  return { period, classCode, room }
}

/** DEFAULT_TIMETABLE[díaDeCiclo 1..6] = clases de ese día (Adv + P1..P6). */
export const DEFAULT_TIMETABLE: Record<number, TimetableSlot[]> = {
  1: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESSSL2', 'Lab2'),
    slot('P2', 'MAA&ASL1', 'R6'),
    slot('P3', 'ECOHLSL2', 'R1'),
    slot('P4', 'ADV9', 'R24'),
    slot('P5', 'ENGAHL1', 'R8'),
    slot('P6', 'BMHL2', 'R2'),
  ],
  2: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'BMHL2', 'R2'),
    slot('P2', 'ICFES5', 'Lab5'),
    slot('P3', 'ENGAHL1', 'R8'),
    slot('P4', 'ECOHLSL2', 'R1'),
    slot('P5', 'ESPASL2', 'R3'),
    slot('P6', 'MAA&ASL1', 'R5'),
  ],
  3: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ENGAHL1', 'R8'),
    slot('P2', 'ECOHLSL2', 'R1'),
    slot('P3', 'BMHL2', 'R4'),
    slot('P4', 'ESSSL2', 'Lab7'),
    slot('P5', 'MAA&ASL1', 'R6'),
    slot('P6', 'ESPASL2', 'R6'),
  ],
  4: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'BMHL2', 'R2'),
    slot('P2', 'ESSSL2', 'Lab7'),
    slot('P3', 'ECOHLSL2', 'R1'),
    slot('P4', 'ESPASL2', 'R9'),
    slot('P5', 'TOK2', 'R2'),
    slot('P6', 'ENGAHL1', 'R8'),
  ],
  5: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'BMHL2', 'R2'),
    slot('P2', 'ENGAHL1', 'R8'),
    slot('P3', 'MAA&ASL1', 'R6'),
    slot('P4', 'ECOHLSL2', 'R1'),
    slot('P5', 'SH7', ''),
    slot('P6', 'CIESOC6', 'R1'),
  ],
  6: [
    slot('Adv', 'ADV9', 'R24'),
    slot('P1', 'ESPASL2', 'R3'),
    slot('P2', 'ECOHLSL2', 'R1'),
    slot('P3', 'ENGAHL1', 'R7'),
    slot('P4', 'BMHL2', 'R2'),
    slot('P5', 'TOK2', 'R3'),
    slot('P6', 'ESSSL2', 'Lab3'),
  ],
}

export const DEFAULT_SETUP: SchoolSetup = {
  periods: DEFAULT_PERIODS,
  classes: DEFAULT_CLASSES,
  timetable: DEFAULT_TIMETABLE,
}
