/**
 * Calendario oficial del Colegio Colombo Británico 2026-2027, en lo que le toca a
 * un estudiante de 11º (Secondary / DP).
 *
 * Dos cosas distintas viven aquí:
 *
 *  1. DÍAS SIN CLASE — semanas de receso, Semana Santa, Professional Development
 *     Days y vacaciones. Son tan importantes como los festivos porque **el ciclo de
 *     6 días tampoco avanza** en ellos: si el ciclo siguiera contando durante la
 *     Recess Week, al volver el 13 de octubre el horario estaría corrido cinco días.
 *  2. EVENTOS — fechas de 11º y de Secundaria que conviene tener a la vista. Se
 *     siembran una sola vez en el calendario y desde ahí se pueden borrar o editar.
 */

export interface NoClassPeriod {
  /** Primer día sin clase (inclusive). */
  from: string
  /** Último día sin clase (inclusive). Si falta, es un solo día. */
  to?: string
  reason: string
}

/** Rangos sin clase para estudiantes. No incluye festivos: esos van en holidays.ts. */
export const NO_CLASS_PERIODS: NoClassPeriod[] = [
  { from: '2026-09-22', reason: 'Professional Development Day' },
  { from: '2026-10-05', to: '2026-10-09', reason: 'Recess Week' },
  { from: '2026-12-17', to: '2027-01-12', reason: 'Vacaciones de fin de año' },
  { from: '2027-03-22', to: '2027-04-02', reason: 'Semana Santa y Easter Week' },
  { from: '2027-04-22', reason: 'Professional Development Day' },
  { from: '2027-05-07', reason: 'Día del Maestro (sin clases)' },
]

/** Primer y último día de clases del año escolar. Fuera de ahí no hay ciclo. */
export const SCHOOL_YEAR = { start: '2026-08-18', end: '2027-06-23' }

function expand(periods: NoClassPeriod[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of periods) {
    const last = p.to ?? p.from
    const d = new Date(`${p.from}T00:00:00Z`)
    const end = new Date(`${last}T00:00:00Z`)
    while (d <= end) {
      out[d.toISOString().slice(0, 10)] = p.reason
      d.setUTCDate(d.getUTCDate() + 1)
    }
  }
  return out
}

const NO_CLASS_BY_DATE = expand(NO_CLASS_PERIODS)

/**
 * ¿Ese día el colegio no tiene clases? `extra` son los días que Juan Diego añade
 * desde la app cuando el colegio anuncia uno que no estaba en el calendario.
 */
export function noClassReason(date: string, extra: string[] = []): string | undefined {
  if (extra.includes(date)) return 'Día sin clase'
  if (date < SCHOOL_YEAR.start) return 'Antes del inicio de clases'
  if (date > SCHOOL_YEAR.end) return 'Vacaciones'
  return NO_CLASS_BY_DATE[date]
}

// --- Eventos del año --------------------------------------------------------

export interface SeedEvent {
  date: string
  title: string
  important?: boolean
  time?: string
  notes?: string
}

/**
 * Fechas de 11º y de Secundaria del calendario oficial. `important` marca lo que
 * de verdad mueve la aguja: cierres de periodo, exámenes, entrega de boletines y
 * el viaje de 11º.
 */
export const SCHOOL_EVENTS: SeedEvent[] = [
  // Agosto - Septiembre 2026
  { date: '2026-08-28', title: 'Whole School Assembly', time: '10:00' },
  { date: '2026-08-31', title: 'Empiezan las ECAs' },
  { date: '2026-09-02', title: 'Houses Opening Day', notes: 'Gimnasio del CCB' },
  { date: '2026-09-04', title: 'Reunión de padres de 11º', time: '08:00', important: true },
  { date: '2026-09-07', title: 'Elecciones de Consejo Estudiantil (toda la semana)' },
  { date: '2026-09-08', title: 'Empiezan las sesiones de refuerzo', time: '15:05' },
  { date: '2026-09-22', title: 'Professional Development Day — sin clases', important: true },
  { date: '2026-09-24', title: 'Santa Misa', time: '08:10' },

  // Octubre 2026
  { date: '2026-10-02', title: 'Cumpleaños 70 del CCB y día de San Francisco de Asís' },
  { date: '2026-10-02', title: 'Progress Reports de 6º a 12º', important: true },
  { date: '2026-10-05', title: 'Recess Week — sin clases hasta el 9', important: true },
  { date: '2026-10-13', title: 'Regreso a clases', important: true },
  { date: '2026-10-13', title: 'Assembly Día de la Etnicidad (10º-12º)', time: '09:00' },
  { date: '2026-10-14', title: 'Prueba Pickdream de orientación profesional (11º)', time: '08:00', important: true, notes: 'Biblioteca de Secundaria, 8:00 a 12:00.' },
  { date: '2026-10-16', title: 'CCB MUN Simulation Day', time: '08:00' },
  { date: '2026-10-22', title: 'Santa Misa', time: '08:10' },
  { date: '2026-10-30', title: 'Halloween y Día del Niño — salida 1:00 pm', important: true, notes: 'Sin ECAs ni clubes.' },

  // Noviembre 2026
  { date: '2026-11-03', title: 'Interhouse de atletismo y natación (6º-12º), hasta el 10', time: '08:00' },
  { date: '2026-11-06', title: 'Assembly Independencia de Cartagena', time: '10:20' },
  { date: '2026-11-11', title: 'Remembrance Day — Poppy Appeal', time: '10:50' },
  { date: '2026-11-12', title: 'Coffee & Communi-TEA DP-CP de 11º', time: '08:00' },
  { date: '2026-11-13', title: 'Termina el primer periodo académico (6º-11º)', important: true },
  { date: '2026-11-17', title: 'Empieza el segundo periodo académico', important: true },
  { date: '2026-11-18', title: 'CCB MUN en la Universidad Icesi, hasta el 20', time: '08:00' },
  { date: '2026-11-26', title: 'Santa Misa', time: '08:10' },
  { date: '2026-11-28', title: 'CCB Ride', time: '06:00' },

  // Diciembre 2026
  { date: '2026-12-04', title: 'Boletines del primer periodo — Three-way Conferences', time: '08:00', important: true },
  { date: '2026-12-04', title: 'Día de las Velitas en el CCB', time: '17:30' },
  { date: '2026-12-15', title: 'Novena de Secundaria', time: '10:20' },
  { date: '2026-12-15', title: 'Último día de ECAs y clubes' },
  { date: '2026-12-16', title: 'Último día de clases del año — salida 1:00 pm', important: true },

  // Enero 2027
  { date: '2027-01-13', title: 'Regreso a clases', important: true },
  { date: '2027-01-22', title: 'Segundos Progress Reports (6º-11º)', important: true },
  { date: '2027-01-27', title: '«Corazón Colombo — We Are One» Day', time: '10:00' },
  { date: '2027-01-28', title: 'Santa Misa', time: '08:10' },

  // Febrero 2027
  { date: '2027-02-09', title: 'Digital Detox Day' },
  { date: '2027-02-10', title: 'Miércoles de Ceniza (Secundaria)', time: '08:30' },
  { date: '2027-02-12', title: 'Spirit Day de San Valentín' },
  { date: '2027-02-18', title: 'Coffee & Communi-TEA DP-CP de 11º', time: '08:00' },
  { date: '2027-02-25', title: 'Santa Misa', time: '08:10' },
  { date: '2027-02-25', title: 'CCB Musical, hasta el 27', time: '18:00' },

  // Marzo 2027
  { date: '2027-03-03', title: 'Big Games en Barranquilla (2º-11º), hasta el 6' },
  { date: '2027-03-05', title: 'Termina el segundo periodo académico (6º-11º)', important: true },
  { date: '2027-03-08', title: 'Empieza el tercer periodo académico', important: true },
  { date: '2027-03-08', title: 'Interhouse de atletismo y deportes, hasta el 15', time: '07:30' },
  { date: '2027-03-13', title: 'CCB Festival', time: '09:00' },
  { date: '2027-03-17', title: 'Spirit Day de San Patricio' },
  { date: '2027-03-18', title: 'Santa Misa', time: '08:10' },
  { date: '2027-03-22', title: 'Semana Santa — sin clases hasta el 2 de abril', important: true },

  // Abril 2027
  { date: '2027-04-05', title: 'Regreso a clases', important: true },
  { date: '2027-04-13', title: 'TOK Exhibition de 11º', time: '08:00', important: true, notes: 'Auditorio AEBL / Gimnasio, 8:00 a 10:00.' },
  { date: '2027-04-14', title: 'DP/CP Night', time: '17:00' },
  { date: '2027-04-16', title: 'Boletines del segundo periodo — Three-way Conferences', time: '08:00', important: true },
  { date: '2027-04-19', title: 'Viaje GoBeyond de 11º, hasta el 24', important: true, notes: 'Educación al aire libre. Sale el martes y vuelve el sábado.' },
  { date: '2027-04-21', title: 'Exhibición de Artes Visuales y Música del IBDP', time: '14:00' },
  { date: '2027-04-22', title: 'Professional Development Day — sin clases', important: true },
  { date: '2027-04-23', title: 'Assembly de 10º y 11º', time: '14:00' },
  { date: '2027-04-26', title: 'Language Day — Whole School Assembly', time: '08:00' },
  { date: '2027-04-28', title: 'Santa Misa', time: '08:10' },

  // Mayo 2027
  { date: '2027-05-06', title: 'Terceros Progress Reports de Secundaria', important: true },
  { date: '2027-05-07', title: 'Día del Maestro — sin clases', important: true },
  { date: '2027-05-11', title: 'Semana de Mindfulness y Salud Mental, hasta el 14' },
  { date: '2027-05-11', title: 'Interhouse de deportes, hasta el 17', time: '07:30' },
  { date: '2027-05-24', title: 'Ceremonia de cierre de las Houses', time: '08:15' },
  { date: '2027-05-27', title: 'Santa Misa', time: '08:10' },

  // Junio 2027
  { date: '2027-06-03', title: 'Mock exams de 11º, hasta el 17', time: '08:00', important: true, notes: 'Biblioteca de Secundaria. Son los simulacros del DP: aquí se ve de verdad cómo va el año.' },
  { date: '2027-06-11', title: 'Grado de 12º', time: '17:00' },
  { date: '2027-06-21', title: 'Assembly de despedida 9º, 10º y 11º — Prefects', time: '09:00' },
  { date: '2027-06-22', title: 'Termina el tercer periodo académico (6º-11º)', important: true },
  { date: '2027-06-23', title: 'Último día de clases — Whole School Assembly', important: true },
  { date: '2027-06-23', title: 'Actividades de recuperación, hasta el 25', time: '12:30' },
  { date: '2027-06-30', title: 'Boletines finales — Three-way Conferences', time: '08:00', important: true },
]
