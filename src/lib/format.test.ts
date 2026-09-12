import { describe, expect, it } from 'vitest'
import { formatAmountInput, formatMoney, formatPercent, formatSigned, parseAmountInput } from './format'
import { formatMonthShort, lastMonths, monthsBetween, shiftMonth, toLocalISO } from './dates'

/** Intl usa espacio duro y el símbolo puede variar: comparamos solo los dígitos. */
function digits(text: string): string {
  return text.replace(/[^\d]/g, '')
}

describe('formatMoney', () => {
  it('agrupa los miles', () => {
    expect(digits(formatMoney(1_250_000))).toBe('1250000')
  })

  it('redondea a pesos enteros', () => {
    expect(digits(formatMoney(1234.6))).toBe('1235')
  })

  it('formatea el cero', () => {
    expect(digits(formatMoney(0))).toBe('0')
  })
})

describe('formatSigned', () => {
  it('pone + a los ingresos y − a los gastos', () => {
    expect(formatSigned(50_000).startsWith('+')).toBe(true)
    expect(formatSigned(-50_000).startsWith('−')).toBe(true)
  })

  it('el cero va sin signo', () => {
    expect(formatSigned(0).startsWith('+')).toBe(false)
    expect(formatSigned(0).startsWith('−')).toBe(false)
  })
})

describe('parseAmountInput', () => {
  it('tolera puntos de miles', () => {
    expect(parseAmountInput('1.250.000')).toBe(1_250_000)
  })

  it('tolera el símbolo de peso y los espacios', () => {
    expect(parseAmountInput('$ 45 000')).toBe(45_000)
  })

  it('tolera comas', () => {
    expect(parseAmountInput('1,500,000')).toBe(1_500_000)
  })

  it('devuelve 0 cuando no hay número', () => {
    expect(parseAmountInput('')).toBe(0)
    expect(parseAmountInput('abc')).toBe(0)
  })

  it('va y vuelve con formatAmountInput', () => {
    expect(parseAmountInput(formatAmountInput(987_654))).toBe(987_654)
  })
})

describe('formatPercent', () => {
  it('redondea la fracción', () => {
    expect(formatPercent(0.384)).toBe('38%')
  })

  it('acota fuera del rango 0-1', () => {
    expect(formatPercent(1.8)).toBe('100%')
    expect(formatPercent(-0.5)).toBe('0%')
  })
})

describe('fechas locales', () => {
  it('toLocalISO usa el día del reloj local, no UTC', () => {
    // 12 de septiembre, 8:00 p.m. hora local: con toISOString() en Colombia esto
    // habría caído en el día 13. Ese era el bug de la versión de entrenamiento.
    expect(toLocalISO(new Date(2026, 8, 12, 20, 0, 0))).toBe('2026-09-12')
  })

  it('toLocalISO rellena mes y día con cero', () => {
    expect(toLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('shiftMonth cruza el año en ambos sentidos', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('lastMonths termina en el mes pedido', () => {
    expect(lastMonths('2026-09', 3)).toEqual(['2026-07', '2026-08', '2026-09'])
  })

  it('monthsBetween no devuelve negativos', () => {
    expect(monthsBetween('2026-09-12', '2026-12-01')).toBe(3)
    expect(monthsBetween('2026-09-12', '2026-06-01')).toBe(0)
  })

  it('formatMonthShort abrevia el mes y el año', () => {
    expect(formatMonthShort('2026-09')).toBe('sep 26')
  })
})
