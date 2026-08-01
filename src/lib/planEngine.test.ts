import { describe, expect, it } from 'vitest'
import { buildDay, buildRange, dayContext, type PlanGoal } from './planEngine'
import { PROGRESSION } from '../data/program'

const META_21K: PlanGoal = { title: 'Media maratón', targetDate: '2026-11-15', targetKm: 21 }

/** Km del fondo largo del sábado de esa semana. */
function fondoDe(sabado: string, goal?: PlanGoal): number {
  const day = buildDay(sabado, goal)
  const largo = day.sessions.find((s) => s.type === 'running-long')
  return largo?.plannedKm ?? 0
}

describe('semana tipo', () => {
  it('genera cada día según la plantilla', () => {
    // 2026-08-10 es lunes; la semana completa va de lunes a domingo.
    const semana = buildRange('2026-08-10', '2026-08-16')
    expect(semana.map((d) => d.sessions.map((s) => s.type))).toEqual([
      ['crossfit', 'rest'], // lunes
      ['running-easy', 'flex'], // martes
      ['crossfit', 'rest'], // miércoles
      ['crossfit', 'swim-technique'], // jueves
      ['running-easy', 'flex'], // viernes
      ['running-long', 'rest'], // sábado
      ['rest'], // domingo
    ])
  })

  it('sigue generando mucho después del plan escrito a mano', () => {
    const day = buildDay('2027-03-16') // martes, ocho meses después
    expect(day.sessions).toHaveLength(2)
    expect(day.sessions[0].type).toBe('running-easy')
    expect(day.weekday).toBe('martes')
  })

  it('da ids únicos y derivados de la fecha, para que el registro los encuentre', () => {
    const day = buildDay('2026-08-11')
    expect(day.sessions.map((s) => s.id)).toEqual(['2026-08-11-am', '2026-08-11-pm'])
  })
})

describe('progresión', () => {
  it('sube el fondo semana a semana', () => {
    expect(fondoDe('2026-08-15')).toBeGreaterThan(fondoDe('2026-08-08'))
  })

  it('mete una semana de descarga cada cuatro', () => {
    const descarga = dayContext('2026-08-08') // semana 4 del programa (índice 3)
    expect(descarga.isDeload).toBe(true)
    expect(descarga.weekIndex + 1).toBe(PROGRESSION.deloadEvery)
    expect(fondoDe('2026-08-08')).toBeLessThan(fondoDe('2026-08-01'))
  })

  it('nunca pasa del tope de la meta antes del día clave', () => {
    const tope = 21 * PROGRESSION.goalCapRatio
    for (const sabado of ['2026-09-19', '2026-10-17', '2026-10-31']) {
      expect(fondoDe(sabado, META_21K)).toBeLessThanOrEqual(tope)
    }
  })
})

describe('meta', () => {
  it('baja la carga en la semana previa', () => {
    // 2026-11-14 es el sábado dentro de los 7 días anteriores a la meta.
    expect(fondoDe('2026-11-14', META_21K)).toBeLessThan(fondoDe('2026-10-31', META_21K))
  })

  it('pone la sesión de la meta el día de la meta', () => {
    const day = buildDay('2026-11-15', META_21K)
    const meta = day.sessions.find((s) => s.type === 'running-goal')
    expect(meta?.plannedKm).toBe(21)
    expect(meta?.id).toBe('2026-11-15-goal')
    expect(day.note).toContain('Media maratón')
  })

  it('convierte la víspera en trote suave', () => {
    const day = buildDay('2026-11-14', META_21K)
    expect(day.sessions.map((s) => s.type)).toEqual(['running-shakeout', 'rest'])
  })

  it('sin meta no toca nada', () => {
    const day = buildDay('2026-11-15')
    expect(day.sessions.some((s) => s.type === 'running-goal')).toBe(false)
  })
})

describe('días históricos y festivos', () => {
  it('respeta el plan escrito a mano por encima del generado', () => {
    const day = buildDay('2026-08-05', META_21K)
    expect(day.sessions[0].id).toBe('2026-08-05-goal')
    expect(day.sessions[0].plannedKm).toBe(21)
  })

  it('cambia el funcional por descanso en festivo', () => {
    const day = buildDay('2026-10-12') // lunes, Día de la Raza
    expect(day.sessions[0].type).toBe('rest')
    expect(day.sessions[0].title).toBe('Descanso (festivo)')
    expect(day.note).toContain('Día de la Raza')
  })

  it('no rompe el día de la meta si cae en festivo', () => {
    const goal: PlanGoal = { title: 'Meta en festivo', targetDate: '2026-11-16', targetKm: 15 }
    const day = buildDay('2026-11-16', goal) // Independencia de Cartagena
    expect(day.sessions[0].type).toBe('running-goal')
  })
})

describe('rangos', () => {
  it('devuelve los dos extremos incluidos', () => {
    expect(buildRange('2026-09-01', '2026-09-07')).toHaveLength(7)
  })

  it('devuelve vacío si el rango está al revés', () => {
    expect(buildRange('2026-09-07', '2026-09-01')).toEqual([])
  })
})
