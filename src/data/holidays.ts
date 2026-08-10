/**
 * Festivos de Colombia calculados, no listados a mano: la app genera plan para
 * cualquier fecha, así que necesita saber los festivos de cualquier año.
 *
 * Tres grupos: fecha fija, Ley Emiliani (se corren al lunes siguiente) y los
 * que dependen de la Pascua. En un día festivo el gimnasio cierra, así que el
 * funcional (con entrenador) se cambia por descanso — ver `planEngine.ts`.
 */
import { addDays, toISO, weekdayIndex } from '../lib/dates'

type Fecha = [month: number, day: number, name: string]

const FIJOS: Fecha[] = [
  [1, 1, 'Año Nuevo'],
  [5, 1, 'Día del Trabajo'],
  [7, 20, 'Día de la Independencia'],
  [8, 7, 'Batalla de Boyacá'],
  [12, 8, 'Inmaculada Concepción'],
  [12, 25, 'Navidad'],
]

// Ley Emiliani: si no caen lunes, se trasladan al lunes siguiente.
const EMILIANI: Fecha[] = [
  [1, 6, 'Reyes Magos'],
  [3, 19, 'San José'],
  [6, 29, 'San Pedro y San Pablo'],
  [8, 15, 'Asunción de la Virgen'],
  [10, 12, 'Día de la Raza'],
  [11, 1, 'Todos los Santos'],
  [11, 11, 'Independencia de Cartagena'],
]

// Días relativos a la Pascua. Los tres últimos ya llevan incluido el traslado
// al lunes (Ascensión, Corpus Christi y Sagrado Corazón son Emiliani).
const PASCUA: [offset: number, name: string][] = [
  [-3, 'Jueves Santo'],
  [-2, 'Viernes Santo'],
  [43, 'Ascensión del Señor'],
  [64, 'Corpus Christi'],
  [71, 'Sagrado Corazón'],
]

/** Domingo de Pascua (algoritmo gregoriano anónimo / Meeus). */
function easterISO(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return toISO(new Date(Date.UTC(year, month - 1, day)))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function lunesSiguiente(iso: string): string {
  const day = weekdayIndex(iso)
  return day === 1 ? iso : addDays(iso, (8 - day) % 7)
}

const cache = new Map<number, Record<string, string>>()

/** Todos los festivos de un año, como `{ 'YYYY-MM-DD': nombre }`. */
export function holidaysInYear(year: number): Record<string, string> {
  const cached = cache.get(year)
  if (cached) return cached

  const days: Record<string, string> = {}
  for (const [month, day, name] of FIJOS) {
    days[`${year}-${pad(month)}-${pad(day)}`] = name
  }
  for (const [month, day, name] of EMILIANI) {
    days[lunesSiguiente(`${year}-${pad(month)}-${pad(day)}`)] = name
  }
  const easter = easterISO(year)
  for (const [offset, name] of PASCUA) {
    days[addDays(easter, offset)] = name
  }

  cache.set(year, days)
  return days
}

export function holidayName(date: string): string | undefined {
  const year = Number(date.slice(0, 4))
  if (!Number.isFinite(year)) return undefined
  return holidaysInYear(year)[date]
}
