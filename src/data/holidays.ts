/**
 * Festivos de Colombia del año escolar 2026-2027 (agosto → julio).
 *
 * Importan por dos motivos: en festivo el gimnasio cierra (ver applyHolidays en
 * plan.ts) y, sobre todo, **el ciclo del colegio no avanza** (ver lib/cycle.ts).
 * Los movibles ya están puestos en el lunes que les toca por la Ley Emiliani, y
 * cuadran con el calendario oficial del colegio 2026-2027.
 */
export const HOLIDAYS: Record<string, string> = {
  // --- 2026 ---
  '2026-07-20': 'Día de la Independencia',
  '2026-08-07': 'Batalla de Boyacá',
  '2026-08-17': 'Asunción de la Virgen',
  '2026-10-12': 'Día de la Raza',
  '2026-11-02': 'Todos los Santos',
  '2026-11-16': 'Independencia de Cartagena',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',

  // --- 2027 ---
  '2027-01-01': 'Año Nuevo',
  '2027-01-11': 'Reyes Magos',
  '2027-03-22': 'Día de San José',
  '2027-03-25': 'Jueves Santo',
  '2027-03-26': 'Viernes Santo',
  '2027-05-01': 'Día del Trabajo',
  '2027-05-10': 'Ascensión del Señor',
  '2027-05-31': 'Corpus Christi',
  '2027-06-07': 'Sagrado Corazón',
  '2027-06-28': 'San Pedro y San Pablo',
  '2027-07-20': 'Día de la Independencia',
}

export function holidayName(date: string): string | undefined {
  return HOLIDAYS[date]
}

export function isHoliday(date: string): boolean {
  return date in HOLIDAYS
}
