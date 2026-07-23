import type { SchoolClass, TimetableSlot } from './schoolTypes'

// Horario de Grade 11 — Colegio Colombo Británico, Cali. Ciclo de 6 días.
// Códigos → materias confirmados por Juan Diego.

export const PERIODS: { period: string; start: string; end: string; kind: 'class' | 'break' }[] = [
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

export const CLASSES: Record<string, SchoolClass> = {
  ADV9: { code: 'ADV9', name: 'Advisory', teacher: 'FL', color: 'bg-ink-300', text: 'text-ink-900' },
  ESSSL2: { code: 'ESSSL2', name: 'SAS', teacher: 'NMR', color: 'bg-cyan-500', text: 'text-white' },
  'MAA&ASL1': { code: 'MAA&ASL1', name: 'Matemáticas', teacher: 'TG', color: 'bg-sky-500', text: 'text-white' },
  ECOHLSL2: { code: 'ECOHLSL2', name: 'Economía', teacher: 'RP', color: 'bg-emerald-500', text: 'text-white' },
  ENGAHL1: { code: 'ENGAHL1', name: 'Inglés', teacher: 'SM', color: 'bg-violet-500', text: 'text-white' },
  BMHL2: { code: 'BMHL2', name: 'Business', teacher: 'JDS', color: 'bg-amber-500', text: 'text-ink-900' },
  ESPASL2: { code: 'ESPASL2', name: 'Español', teacher: 'RV', color: 'bg-rose-500', text: 'text-white' },
  ICFES5: { code: 'ICFES5', name: 'ICFES', teacher: 'NMR/LP/SMI', color: 'bg-fuchsia-500', text: 'text-white' },
  TOK2: { code: 'TOK2', name: 'TOK', teacher: 'PALL', color: 'bg-indigo-500', text: 'text-white' },
  CIESOC6: { code: 'CIESOC6', name: 'Ciencias Sociales', teacher: 'AMM', color: 'bg-teal-500', text: 'text-white' },
  SH7: { code: 'SH7', name: 'Study Hall', teacher: 'LNC', color: 'bg-ink-300', text: 'text-ink-900' },
}

function slot(period: string, classCode: string, room: string): TimetableSlot {
  const p = PERIODS.find((x) => x.period === period)!
  return { period, start: p.start, end: p.end, classCode, room }
}

// TIMETABLE[díaDeCiclo 1..6] = clases de ese día (Adv + P1..P6).
export const TIMETABLE: Record<number, TimetableSlot[]> = {
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
