// Festivos de Colombia. Se irán ampliando a medida que el plan se extienda a
// nuevas fechas. En un día festivo el gimnasio cierra, así que el funcional
// (con entrenador) se reemplaza por descanso — ver applyHolidays en plan.ts.
export const HOLIDAYS: Record<string, string> = {
  '2026-07-20': 'Día de la Independencia',
  '2026-08-07': 'Batalla de Boyacá',
  '2026-08-17': 'Asunción de la Virgen',
  '2026-10-12': 'Día de la Raza',
  '2026-11-02': 'Todos los Santos',
  '2026-11-16': 'Independencia de Cartagena',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
}

export function holidayName(date: string): string | undefined {
  return HOLIDAYS[date]
}

export function isHoliday(date: string): boolean {
  return date in HOLIDAYS
}
