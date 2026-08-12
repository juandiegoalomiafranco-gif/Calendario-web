import type { PeriodDef, SchoolClass, SchoolSetup, TimetableSlot } from '../data/schoolTypes'
import { colorOf, type ColorStyles } from '../data/palette'
import { nowMinutes, toMinutes } from './dates'

/** Un periodo del día ya resuelto: horario, materia y colores listos para pintar. */
export interface ResolvedSlot extends TimetableSlot {
  start: string
  end: string
  kind: PeriodDef['kind']
  startMin: number
  endMin: number
  cls: SchoolClass
  color: ColorStyles
}

const UNKNOWN_CLASS: SchoolClass = {
  code: '',
  name: 'Sin asignar',
  teacher: '',
  color: 'slate',
}

/**
 * Clases de un día del ciclo con su horario resuelto a partir de los periodos.
 * Los descansos (recreo, almuerzo) se incluyen para poder dibujar el día completo;
 * filtra por `kind === 'class'` si sólo quieres las clases.
 */
export function resolveDay(setup: SchoolSetup, cycleDay: number | null): ResolvedSlot[] {
  if (!cycleDay) return []
  const slots = setup.timetable[cycleDay] ?? []
  const byPeriod = new Map(slots.map((s) => [s.period, s]))

  return setup.periods.map((p) => {
    const slot = byPeriod.get(p.period)
    const cls = slot ? (setup.classes[slot.classCode] ?? UNKNOWN_CLASS) : UNKNOWN_CLASS
    return {
      period: p.period,
      classCode: slot?.classCode ?? '',
      room: slot?.room ?? '',
      start: p.start,
      end: p.end,
      kind: p.kind,
      startMin: toMinutes(p.start),
      endMin: toMinutes(p.end),
      cls,
      color: colorOf(cls.color),
    }
  })
}

/** Sólo los periodos que son clase y tienen materia asignada. */
export function classesOnly(slots: ResolvedSlot[]): ResolvedSlot[] {
  return slots.filter((s) => s.kind === 'class' && s.classCode)
}

/**
 * Qué está pasando ahora mismo: la clase en curso y la siguiente del día.
 * `minutes` permite fijar la hora en pruebas; por defecto usa la hora actual.
 */
export function nowAndNext(
  slots: ResolvedSlot[],
  minutes = nowMinutes(),
): { current: ResolvedSlot | null; next: ResolvedSlot | null } {
  const timed = classesOnly(slots)
  const current = timed.find((s) => minutes >= s.startMin && minutes < s.endMin) ?? null
  const next = timed.find((s) => s.startMin > minutes) ?? null
  return { current, next }
}

/** Materias del horario, ordenadas por nombre, sin repetir. */
export function classList(setup: SchoolSetup): SchoolClass[] {
  return Object.values(setup.classes).sort((a, b) => a.name.localeCompare(b.name))
}

/** Códigos de materia que aparecen en algún día del ciclo. */
export function usedClassCodes(setup: SchoolSetup): Set<string> {
  const used = new Set<string>()
  for (const day of Object.values(setup.timetable)) {
    for (const s of day) if (s.classCode) used.add(s.classCode)
  }
  return used
}

/** Código nuevo a partir del nombre de la materia, único dentro del horario. */
export function makeClassCode(name: string, existing: Record<string, SchoolClass>): string {
  const base =
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6) || 'CLASE'
  let code = base
  let n = 2
  while (existing[code]) code = `${base}${n++}`
  return code
}
