import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, formatLong, formatShort, weekStart, weekdayName } from './dates'

describe('aritmética de fechas', () => {
  it('suma y resta días cruzando meses y años', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('cuenta los días entre dos fechas', () => {
    expect(daysBetween('2026-08-01', '2026-08-08')).toBe(7)
    expect(daysBetween('2026-08-08', '2026-08-01')).toBe(-7)
    expect(daysBetween('2026-08-01', '2026-08-01')).toBe(0)
  })

  it('encuentra el lunes de la semana', () => {
    expect(weekStart('2026-08-12')).toBe('2026-08-10') // miércoles -> lunes
    expect(weekStart('2026-08-10')).toBe('2026-08-10') // lunes -> él mismo
    expect(weekStart('2026-08-16')).toBe('2026-08-10') // domingo -> lunes anterior
  })

  it('nombra el día de la semana en español', () => {
    expect(weekdayName('2026-08-10')).toBe('lunes')
    expect(weekdayName('2026-08-16')).toBe('domingo')
  })

  it('formatea corto para las gráficas', () => {
    expect(formatShort('2026-08-05')).toBe('05/08')
  })

  it('formatea largo con una sola mayúscula', () => {
    expect(formatLong('2026-08-05')).toBe('Miércoles, 5 de agosto')
  })
})
