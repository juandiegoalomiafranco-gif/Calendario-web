import type {
  LegacySchoolSetup,
  PeriodDef,
  SchoolClass,
  SchoolSetup,
  TimetableSlot,
} from '../data/schoolTypes'
import {
  DEFAULT_DAY_TYPE_BY_WEEKDAY,
  DEFAULT_PERIOD_SETS,
} from '../data/schoolTimetable'
import { colorOf, type ColorStyles } from '../data/palette'
import { nowMinutes, toMinutes, weekdayIndex } from './dates'

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
 * Sube al formato actual un horario guardado con la forma antigua (un solo juego de
 * horas para los seis días). Sin esto, un setup ya guardado dejaría la app sin
 * horario al añadir el miércoles corto.
 */
export function normalizeSetup(raw: LegacySchoolSetup | SchoolSetup): SchoolSetup {
  const legacy = raw as LegacySchoolSetup
  const periodSets =
    legacy.periodSets ??
    (legacy.periods
      ? { ...DEFAULT_PERIOD_SETS, normal: legacy.periods }
      : DEFAULT_PERIOD_SETS)
  return {
    periodSets,
    dayTypeByWeekday: legacy.dayTypeByWeekday ?? DEFAULT_DAY_TYPE_BY_WEEKDAY,
    classes: raw.classes,
    timetable: raw.timetable,
  }
}

/** Qué tipo de día es esa fecha ('normal', 'miercoles', …). */
export function dayTypeFor(setup: SchoolSetup, dateIso?: string): string {
  if (!dateIso) return 'normal'
  return setup.dayTypeByWeekday[weekdayIndex(dateIso)] ?? 'normal'
}

/** Las horas que rigen esa fecha. Sin fecha, el día normal. */
export function periodsFor(setup: SchoolSetup, dateIso?: string): PeriodDef[] {
  const type = dayTypeFor(setup, dateIso)
  return setup.periodSets[type] ?? setup.periodSets.normal ?? []
}

/**
 * Clases de un día del ciclo con su horario resuelto.
 *
 * Las MATERIAS vienen del día del ciclo (1..6) y las HORAS de la fecha, porque el
 * miércoles el colegio sale a la 1:00 pm con un solo recreo. Los descansos se
 * incluyen para poder dibujar el día completo; filtra por `kind === 'class'` si
 * sólo quieres las clases.
 */
export function resolveDay(
  setup: SchoolSetup,
  cycleDay: number | null,
  dateIso?: string,
): ResolvedSlot[] {
  if (!cycleDay) return []
  const slots = setup.timetable[cycleDay] ?? []
  const byPeriod = new Map(slots.map((s) => [s.period, s]))

  return periodsFor(setup, dateIso).map((p) => {
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
