import { describe, expect, it } from 'vitest'
import { buildRange } from './planEngine'
import { mergeByUpdatedAt } from './merge'
import {
  formatMinutes,
  formatPace,
  kmForEntry,
  lastFinishedWeekDelta,
  summarize,
  weekSummaries,
  type LogMap,
} from './stats'
import type { LogEntry } from '../data/types'

/** Lunes 10-ago a domingo 23-ago de 2026: dos semanas completas. */
const DAYS = buildRange('2026-08-10', '2026-08-23')

function completed(extra: Partial<LogEntry> = {}): LogEntry {
  return { completed: true, ...extra }
}

describe('summarize', () => {
  it('no cuenta los descansos en el cumplimiento', () => {
    // El sábado 15 tiene fondo (entrenamiento) + descanso.
    const log: LogMap = { '2026-08-15-am': completed(), '2026-08-15-pm': completed() }
    const s = summarize(DAYS, log)

    expect(s.completedTrainings).toBe(1)
    expect(s.completedRests).toBe(1)
    // El denominador son solo entrenamientos: hay menos que sesiones totales.
    expect(s.trainings.length).toBeLessThan(s.sessions.length)
    expect(s.completionPct).toBe(Math.round((1 / s.trainings.length) * 100))
  })

  it('avisa cuando no hay nada registrado', () => {
    expect(summarize(DAYS, {}).hasAnyLog).toBe(false)
    expect(summarize(DAYS, { '2026-08-11-am': completed() }).hasAnyLog).toBe(true)
  })

  it('suma los km registrados y distingue los estimados del plan', () => {
    const log: LogMap = {
      '2026-08-11-am': completed({ distanceKm: 7 }), // rodaje con dato propio
      '2026-08-15-am': completed(), // fondo sin dato: cuenta el estimado
    }
    const s = summarize(DAYS, log)

    expect(s.km.registered).toBe(7)
    expect(s.km.estimated).toBeGreaterThan(0)
    expect(s.km.total).toBeCloseTo(s.km.registered + s.km.estimated)
    expect(s.km.longestRun).toBeGreaterThanOrEqual(7)
  })
})

describe('semanas', () => {
  it('marca como en curso solo la semana que termina hoy', () => {
    // Hoy es miércoles 19: la segunda semana todavía no ha terminado.
    const days = buildRange('2026-08-10', '2026-08-19')
    const weeks = weekSummaries(days, {}, '2026-08-19', 12)

    expect(weeks).toHaveLength(2)
    expect(weeks[0].inProgress).toBe(false)
    expect(weeks[1].inProgress).toBe(true)
  })

  it('una semana que termina en domingo está completa', () => {
    const weeks = weekSummaries(DAYS, {}, '2026-08-23', 12)
    expect(weeks[weeks.length - 1].inProgress).toBe(false)
  })

  it('compara la última semana terminada, no la que está en curso', () => {
    const days = buildRange('2026-08-10', '2026-08-19')
    const log: LogMap = {
      '2026-08-15-am': completed({ distanceKm: 12 }), // semana 1, terminada
      '2026-08-18-am': completed({ distanceKm: 3 }), // semana 2, en curso
    }
    const weeks = weekSummaries(days, log, '2026-08-19', 12)

    // Sin dos semanas terminadas no hay comparación posible, y la de 3 km en
    // curso no puede aparecer como una caída.
    const delta = lastFinishedWeekDelta(weeks)
    expect(delta).toBeNull()
  })

  it('con dos semanas terminadas sí compara', () => {
    const log: LogMap = {
      '2026-08-15-am': completed({ distanceKm: 10 }),
      '2026-08-22-am': completed({ distanceKm: 14 }),
    }
    const weeks = weekSummaries(DAYS, log, '2026-08-23', 12)
    expect(lastFinishedWeekDelta(weeks)).toEqual({ last: 14, delta: 4 })
  })
})

describe('formatos', () => {
  it('escribe el ritmo como m:ss', () => {
    expect(formatMinutes(7.5)).toBe('7:30')
    expect(formatMinutes(6.995)).toBe('7:00')
    expect(formatPace(10, 75)).toBe('7:30 /km')
    expect(formatPace(0, 30)).toBeNull()
  })

  it('usa la distancia numérica del plan y no el texto', () => {
    const session = { id: 'x', slot: 'AM', type: 'running-long', title: '', summary: '', why: '', distanceKm: '~0.8–0.9', plannedKm: 0.85 } as const
    expect(kmForEntry(session, completed())).toEqual({ km: 0.85, estimated: true })
    expect(kmForEntry(session, completed({ distanceKm: 1.2 }))).toEqual({ km: 1.2, estimated: false })
  })
})

describe('fusión con la nube', () => {
  it('conserva lo registrado sin conexión', () => {
    const local: LogMap = { a: { completed: true, distanceKm: 8, updatedAt: '2026-08-11T10:00:00Z' } }
    const cloud: LogMap = { a: { completed: false, updatedAt: '2026-08-10T10:00:00Z' } }

    const { merged, pending } = mergeByUpdatedAt(local, cloud)
    expect(merged.a.distanceKm).toBe(8)
    expect(pending).toEqual(['a'])
  })

  it('deja ganar a la nube cuando es más nueva', () => {
    const local: LogMap = { a: { completed: true, updatedAt: '2026-08-09T10:00:00Z' } }
    const cloud: LogMap = { a: { completed: false, updatedAt: '2026-08-10T10:00:00Z' } }

    const { merged, pending } = mergeByUpdatedAt(local, cloud)
    expect(merged.a.completed).toBe(false)
    expect(pending).toEqual([])
  })

  it('sube lo que la nube no tiene y conserva lo que solo está en la nube', () => {
    const local: LogMap = { a: { completed: true, updatedAt: '2026-08-11T10:00:00Z' } }
    const cloud: LogMap = { b: { completed: true, updatedAt: '2026-08-10T10:00:00Z' } }

    const { merged, pending } = mergeByUpdatedAt(local, cloud)
    expect(Object.keys(merged).sort()).toEqual(['a', 'b'])
    expect(pending).toEqual(['a'])
  })
})
