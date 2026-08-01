import { describe, expect, it } from 'vitest'
import { holidayName, holidaysInYear, isHoliday } from './holidays'

describe('festivos de Colombia', () => {
  it('reproduce los de 2026 que estaban escritos a mano', () => {
    expect(holidayName('2026-07-20')).toBe('Día de la Independencia')
    expect(holidayName('2026-08-07')).toBe('Batalla de Boyacá')
    expect(holidayName('2026-08-17')).toBe('Asunción de la Virgen')
    expect(holidayName('2026-10-12')).toBe('Día de la Raza')
    expect(holidayName('2026-11-02')).toBe('Todos los Santos')
    expect(holidayName('2026-11-16')).toBe('Independencia de Cartagena')
    expect(holidayName('2026-12-08')).toBe('Inmaculada Concepción')
    expect(holidayName('2026-12-25')).toBe('Navidad')
  })

  it('traslada al lunes siguiente los de Ley Emiliani', () => {
    // 15-ago-2026 cae sábado, así que el festivo es el lunes 17.
    expect(isHoliday('2026-08-15')).toBe(false)
    expect(isHoliday('2026-08-17')).toBe(true)
  })

  it('calcula los que dependen de la Pascua', () => {
    // Domingo de Pascua 2026: 5 de abril.
    expect(holidayName('2026-04-02')).toBe('Jueves Santo')
    expect(holidayName('2026-04-03')).toBe('Viernes Santo')
    expect(holidayName('2026-05-18')).toBe('Ascensión del Señor')
    expect(holidayName('2026-06-08')).toBe('Corpus Christi')
    expect(holidayName('2026-06-15')).toBe('Sagrado Corazón')
  })

  it('sirve para cualquier año, no solo 2026', () => {
    expect(holidayName('2027-01-01')).toBe('Año Nuevo')
    expect(holidayName('2027-03-26')).toBe('Viernes Santo') // Pascua 2027: 28 de marzo
    expect(Object.keys(holidaysInYear(2028))).toHaveLength(18)
  })

  it('un día normal no es festivo', () => {
    expect(isHoliday('2026-08-18')).toBe(false)
    expect(holidayName('no-es-fecha')).toBeUndefined()
  })
})
