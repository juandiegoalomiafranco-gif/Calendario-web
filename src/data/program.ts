/**
 * El programa: la semana tipo y las reglas de progresión con las que el motor
 * (`src/lib/planEngine.ts`) genera el plan de CUALQUIER fecha.
 *
 * Antes el calendario era un array escrito a mano que se acababa el 5 de agosto
 * de 2026. Aquí está la misma semana que ya venías haciendo, pero como regla:
 *
 *   lun  funcional        · descanso
 *   mar  rodaje suave     · flex (vóley o nado técnica)
 *   mié  funcional        · descanso total
 *   jue  funcional        · nado técnica
 *   vie  rodaje suave     · flex (fútbol o nado resistencia)
 *   sáb  fondo largo      · descanso / recuperación
 *   dom  descanso total
 */
import type { Session } from './types'

/** Primer día del programa: ancla para contar las semanas de progresión. */
export const PROGRAM_START = '2026-07-15'

export const PROGRESSION = {
  easyRunBaseKm: 5,
  easyRunIncrease: 0.04,
  easyRunMaxKm: 10,
  longRunBaseKm: 10,
  longRunIncrease: 0.08,
  longRunMaxKm: 24,
  /** Cada cuántas semanas toca una de descarga, y cuánto se baja. */
  deloadEvery: 4,
  deloadFactor: 0.7,
  /** El fondo nunca pasa de este porcentaje de la meta antes del día clave. */
  goalCapRatio: 0.85,
  /** Días de taper antes de la meta, y cuánto se recorta el fondo dentro de ellos. */
  taperDays: 7,
  taperFactor: 0.6,
}

export function roundHalfKm(km: number): number {
  return Math.round(km * 2) / 2
}

/** Como `roundHalfKm`, pero sin pasarse nunca hacia arriba (para los topes). */
export function floorHalfKm(km: number): number {
  return Math.floor(km * 2) / 2
}

/** Texto de distancia para los títulos: "12.5" o "12" (nunca coma decimal). */
export function formatKm(km: number): string {
  return Number.isInteger(km) ? String(km) : km.toFixed(1)
}

// --- Fábricas de sesiones -----------------------------------------------------
// Los textos viven aquí una sola vez; el motor solo decide qué día va cada cosa.

const CROSSFIT_WHY =
  'Es tu sesión fija con el entrenador (funcional tipo CrossFit + pesas). Ya te da de sobra el estímulo de alta intensidad de la semana — por eso el running de estos días no necesita ser también duro.'

const CROSSFIT_SELF_REG =
  'Si traes piernas cargadas (de correr, fútbol o vóley), avísale a tu entrenador antes de empezar para que module el volumen de tren inferior de hoy.'

export function crossfit(id: string, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'crossfit',
    title: 'Funcional / CrossFit con entrenador',
    summary: 'Funcional fijo',
    why: note ?? CROSSFIT_WHY,
    selfRegulation: CROSSFIT_SELF_REG,
  }
}

export function restPM(id: string, title = 'Descanso / movilidad suave'): Session {
  return {
    id,
    slot: 'PM',
    type: 'rest',
    title,
    summary: 'Descanso',
    why: 'Después de una sesión fuerte por la mañana, la tarde es para recuperar: foam roller 10-15 min, estiramiento suave o simplemente descansar. No agregues carga nueva.',
  }
}

export function restFullDay(id: string): Session {
  return {
    id,
    slot: 'ALL',
    type: 'rest',
    title: 'Descanso total',
    summary: 'Descanso total',
    why: 'Domingo de descanso completo: sin running, sin natación, sin CrossFit. El cuerpo se adapta y se fortalece en el descanso, no solo en el entrenamiento.',
  }
}

export function easyRun(id: string, km: string, plannedKm?: number, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-easy',
    title: `Rodaje suave — ${km} km`,
    summary: `Running ${km} km`,
    distanceKm: km,
    plannedKm,
    pace: 'El que te salga yendo cómodo (ajustable semana a semana)',
    effort:
      'Conversacional: debes poder hablar en frases completas. Si te falta el aire, vas demasiado rápido — camina hasta recuperar.',
    why:
      note ??
      'Este es el entrenamiento que de verdad construye tu base aeróbica. Ve más lento de lo que creas necesario — el objetivo es terminar cómodo, no el número de ritmo.',
    selfRegulation: 'Debes poder hablar en frases completas. Si no puedes, para y camina hasta recuperar.',
  }
}

export function longRun(id: string, km: string, plannedKm?: number, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-long',
    title: `Fondo largo — ${km} km`,
    summary: `Fondo ${km} km`,
    distanceKm: km,
    plannedKm,
    pace: 'Cómodo, y más lento al final si hace falta',
    effort:
      'Cómodo la mayor parte; hacia el final cuesta más y está bien. Camina en las subidas cuando el cuerpo lo pida.',
    why: note ?? 'Construye el volumen hacia tu meta de forma progresiva, y siempre con un día de descanso detrás.',
    selfRegulation:
      'Lleva agua (y algo de sal si son más de 60-70 min). Caminar en las subidas o cuando el cuerpo lo pida es parte del plan, no un fracaso.',
  }
}

export function shakeoutRun(id: string, km: string, plannedKm?: number): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-shakeout',
    title: `Trote muy suave — ${km} km (opcional)`,
    summary: 'Shakeout suave',
    distanceKm: km,
    plannedKm,
    pace: 'Muy suave, sin ninguna exigencia',
    effort: 'Tan fácil que podrías cantar. Si dudas, es mejor descansar.',
    why: 'Activa las piernas sin gastar energía antes del día clave. Si sientes cualquier fatiga, es mejor descansar en su lugar.',
    selfRegulation: 'Esta sesión es prescindible: si las piernas no están al 100%, descansa en vez de trotar.',
  }
}

export function goalRun(id: string, km: number, title: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-goal',
    title: `🎯 ${title}`,
    summary: `Meta: ${formatKm(km)} km`,
    distanceKm: formatKm(km),
    plannedKm: km,
    pace: 'Esfuerzo conversacional — sin meta de tiempo fija',
    effort:
      'Cómodo la mayor parte del camino; el final va a costar y está bien. Camina cuando lo necesites: terminar bien es el objetivo.',
    why: 'Esta es la fecha que te marcaste, pero el objetivo real es terminar bien y sin lesión — no un ritmo exacto.',
    selfRegulation:
      'Hidratación y algo de sal/energía desde antes de la hora. Si el cuerpo pide parar, para — no hay nada que demostrar forzando.',
  }
}

export function swimTechnique(id: string): Session {
  return {
    id,
    slot: 'PM',
    type: 'swim-technique',
    title: 'Natación — técnica',
    summary: 'Nado técnica',
    distanceKm: '~0.6–0.7 km',
    plannedKm: 0.65,
    pace: 'Sin objetivo de ritmo — foco en técnica',
    structure: [
      '100 m calentamiento suave',
      '4×50 m drills de técnica (lo que te corrija tu profesor), descanso 20–30 s',
      '6×50 m a ritmo moderado (~2:00–2:15 /100 m), descanso 20 s',
      '100 m suelta',
    ],
    why: 'Como recién empiezas a nadar, la prioridad es la forma, no la velocidad. Además es un estímulo cardiovascular sin impacto — buena recuperación activa para las piernas.',
    selfRegulation: 'Si pierdes la técnica por cansancio, para y descansa más entre repeticiones.',
  }
}

export function swimEndurance(id: string, structure: string[], totalKm: string, plannedKm?: number): Session {
  return {
    id,
    slot: 'PM',
    type: 'swim-endurance',
    title: 'Natación — resistencia',
    summary: 'Nado resistencia',
    distanceKm: totalKm,
    plannedKm,
    pace: '2:10–2:20 /100 m',
    structure,
    why: 'Progresión de distancia continua en el agua, construyendo resistencia poco a poco sin forzar la técnica.',
    selfRegulation: 'Si te falta el aire o pierdes la forma, baja el ritmo — la prioridad sigue siendo la técnica.',
  }
}

export function flexSlot(id: string, sport: 'fútbol' | 'vóley', altTitle: string): Session {
  const deporte = sport === 'fútbol' ? 'Fútbol' : 'Vóley'
  return {
    id,
    slot: 'PM',
    type: 'flex',
    title: `${deporte} (si juegas) o natación`,
    summary: `${deporte} / nado`,
    flexOptions: [`${deporte} recreativo`, altTitle],
    why: `${sport === 'fútbol' ? 'El fútbol' : 'El vóley'} cuenta como sesión de alta intensidad/impacto. Si juegas esta semana, esta sesión la reemplaza — no se suma a la natación del mismo día.`,
    selfRegulation:
      'Si jugaste fútbol o vóley esta semana, no agregues la natación de resistencia el mismo día — elige una de las dos.',
  }
}

// --- Semana tipo --------------------------------------------------------------

export interface DayContext {
  date: string
  /** Semanas completas desde `PROGRAM_START`. */
  weekIndex: number
  easyRunKm: number
  longRunKm: number
  isDeload: boolean
}

const SWIM_ENDURANCE_STRUCTURE = [
  '100 m calentamiento',
  '4×100 m @ 2:10–2:20/100 m, descanso 20 s',
  '100 m suelta',
]

type DayBuilder = (ctx: DayContext) => Session[]

/** Índice = día de la semana (0 domingo … 6 sábado). */
export const WEEK_TEMPLATE: Record<number, DayBuilder> = {
  0: (c) => [restFullDay(`${c.date}-all`)],
  1: (c) => [crossfit(`${c.date}-am`), restPM(`${c.date}-pm`)],
  2: (c) => [
    easyRun(`${c.date}-am`, formatKm(c.easyRunKm), c.easyRunKm),
    flexSlot(`${c.date}-pm`, 'vóley', 'Natación — técnica'),
  ],
  3: (c) => [crossfit(`${c.date}-am`), restPM(`${c.date}-pm`, 'Descanso total')],
  4: (c) => [crossfit(`${c.date}-am`), swimTechnique(`${c.date}-pm`)],
  5: (c) => [
    easyRun(`${c.date}-am`, formatKm(c.easyRunKm), c.easyRunKm),
    flexSlot(`${c.date}-pm`, 'fútbol', 'Natación — resistencia'),
  ],
  6: (c) => [
    longRun(
      `${c.date}-am`,
      formatKm(c.longRunKm),
      c.longRunKm,
      c.isDeload
        ? 'Semana de descarga: el fondo baja a propósito para que el cuerpo asimile lo de las semanas anteriores. Bajar carga también es entrenar.'
        : undefined,
    ),
    restPM(`${c.date}-pm`, 'Descanso / recuperación'),
  ],
}

export { SWIM_ENDURANCE_STRUCTURE }
