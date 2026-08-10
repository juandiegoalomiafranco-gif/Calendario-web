/**
 * El plan original escrito a mano (15 de julio → 5 de agosto de 2026).
 *
 * Se conserva tal cual, con los mismos `session.id`, porque son las claves con
 * las que está guardado tu registro en `training_log`. El motor de plan da
 * prioridad a estos días sobre los que genera, así que la historia no cambia
 * aunque cambien las reglas del programa.
 */
import type { DayPlan, Session } from './types'
import { weekdayName } from '../lib/dates'
import {
  crossfit,
  easyRun,
  flexSlot,
  goalRun,
  longRun,
  restFullDay,
  restPM,
  shakeoutRun,
  swimEndurance,
  swimTechnique,
} from './program'

/** Último día del plan escrito a mano. A partir de aquí manda el generador. */
export const LEGACY_END = '2026-08-05'

function day(date: string, sessions: Session[], note?: string): DayPlan {
  return { date, weekday: weekdayName(date), sessions, note }
}

const DAYS: DayPlan[] = [
  day('2026-07-15', [crossfit('2026-07-15-am'), restPM('2026-07-15-pm')]),
  day('2026-07-16', [crossfit('2026-07-16-am'), swimTechnique('2026-07-16-pm')]),
  day('2026-07-17', [
    easyRun(
      '2026-07-17-am',
      '5',
      5,
      'Primer rodaje del plan: arranca conservador, la idea es sentir lo cómodo que se puede ir yendo más lento.',
    ),
    flexSlot(
      '2026-07-17-pm',
      'fútbol',
      swimEndurance(
        '2026-07-17-pm-swim',
        ['100 m calentamiento', '4×75 m @ 2:10–2:20/100 m, descanso 20 s', '100 m suelta'],
        '~0.5',
        0.5,
      ),
    ),
  ]),
  day('2026-07-18', [longRun('2026-07-18-am', '10–11', 10.5), restPM('2026-07-18-pm', 'Descanso / recuperación')]),
  day('2026-07-19', [restFullDay('2026-07-19')]),
  day('2026-07-20', [crossfit('2026-07-20-am'), restPM('2026-07-20-pm')]),
  day('2026-07-21', [
    easyRun('2026-07-21-am', '5', 5),
    flexSlot('2026-07-21-pm', 'vóley', swimTechnique('2026-07-21-pm-swim')),
  ]),
  day('2026-07-22', [crossfit('2026-07-22-am'), restPM('2026-07-22-pm', 'Descanso total')]),
  day('2026-07-23', [crossfit('2026-07-23-am'), swimTechnique('2026-07-23-pm')]),
  day('2026-07-24', [
    easyRun('2026-07-24-am', '5', 5),
    flexSlot(
      '2026-07-24-pm',
      'fútbol',
      swimEndurance(
        '2026-07-24-pm-swim',
        ['100 m calentamiento', '3×100 m @ 2:10–2:20/100 m, descanso 20–25 s', '100 m suelta'],
        '~0.7',
        0.7,
      ),
    ),
  ]),
  day('2026-07-25', [longRun('2026-07-25-am', '14–15', 14.5), restPM('2026-07-25-pm', 'Descanso / recuperación')]),
  day('2026-07-26', [restFullDay('2026-07-26')]),
  day('2026-07-27', [crossfit('2026-07-27-am'), restPM('2026-07-27-pm')]),
  day('2026-07-28', [
    easyRun('2026-07-28-am', '6', 6),
    flexSlot('2026-07-28-pm', 'vóley', swimTechnique('2026-07-28-pm-swim')),
  ]),
  day('2026-07-29', [crossfit('2026-07-29-am'), restPM('2026-07-29-pm', 'Descanso total')]),
  day('2026-07-30', [crossfit('2026-07-30-am'), swimTechnique('2026-07-30-pm')]),
  day('2026-07-31', [
    easyRun('2026-07-31-am', '5', 5),
    flexSlot(
      '2026-07-31-pm',
      'fútbol',
      swimEndurance(
        '2026-07-31-pm-swim',
        ['100 m calentamiento', '4×100 m @ 2:10–2:20/100 m, descanso 20 s (más continuo)', '100 m suelta'],
        '~0.8–0.9',
        0.85,
      ),
    ),
  ]),
  day('2026-08-01', [
    longRun(
      '2026-08-01-am',
      '17–18',
      17.5,
      'Último fondo largo antes del intento de los 21 km. A propósito no llega a la distancia completa — nunca se corre el objetivo entero justo antes del día clave.',
    ),
    restPM('2026-08-01-pm', 'Descanso / recuperación'),
  ]),
  day('2026-08-02', [restFullDay('2026-08-02')]),
  day('2026-08-03', [
    crossfit(
      '2026-08-03-am',
      'Última sesión de funcional antes del intento de los 21 km — es un buen momento para pedirle a tu entrenador que baje el volumen de piernas (semana de taper).',
    ),
    restPM('2026-08-03-pm'),
  ]),
  day('2026-08-04', [
    shakeoutRun('2026-08-04-am', '3–4', 3.5),
    restPM('2026-08-04-pm', 'Descanso / movilidad suave'),
  ]),
  day(
    '2026-08-05',
    [goalRun('2026-08-05-goal', 21, 'Intento de 21 km'), restPM('2026-08-05-pm', 'Descanso total — te lo ganaste')],
    'Se reemplaza el funcional fijo de hoy por el intento de los 21 km — no hagas CrossFit este día.',
  ),
]

export const LEGACY_DAYS: Record<string, DayPlan> = Object.fromEntries(DAYS.map((d) => [d.date, d]))
