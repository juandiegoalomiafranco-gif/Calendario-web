import type { DayPlan, Session } from './types'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function weekdayOf(date: string): string {
  // date is YYYY-MM-DD, parsed as UTC to avoid local-timezone day shifts
  const d = new Date(`${date}T00:00:00Z`)
  return WEEKDAYS[d.getUTCDay()]
}

const CROSSFIT_WHY =
  'Es tu sesión fija con el entrenador (funcional tipo CrossFit + pesas). Ya te da de sobra el estímulo de alta intensidad de la semana — por eso el running de estos días no necesita ser también duro.'

const CROSSFIT_SELF_REG =
  'Si traes piernas cargadas (de correr, fútbol o vóley), avísale a tu entrenador antes de empezar para que module el volumen de tren inferior de hoy.'

function crossfit(id: string, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'crossfit',
    title: 'Funcional / CrossFit con entrenador',
    summary: 'Funcional fijo',
    fixed: true,
    why: note ?? CROSSFIT_WHY,
    selfRegulation: CROSSFIT_SELF_REG,
  }
}

function restPM(id: string, title = 'Descanso / movilidad suave'): Session {
  return {
    id,
    slot: 'PM',
    type: 'rest',
    title,
    summary: 'Descanso',
    why: 'Después de una sesión fuerte por la mañana, la tarde es para recuperar: foam roller 10-15 min, estiramiento suave o simplemente descansar. No agregues carga nueva.',
  }
}

function restFullDay(id: string): Session {
  return {
    id,
    slot: 'ALL',
    type: 'rest',
    title: 'Descanso total',
    summary: 'Descanso total',
    fixed: true,
    why: 'Domingo de descanso completo: sin running, sin natación, sin CrossFit. El cuerpo se adapta y se fortalece en el descanso, no solo en el entrenamiento.',
  }
}

function easyRun(id: string, km: string, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-easy',
    title: `Rodaje suave — ${km} km`,
    summary: `Running ${km} km`,
    distanceKm: km,
    pace: '7:30–8:30 /km (ajustable semana a semana)',
    hrTarget: 'Zona 2: 122–141 ppm. Tolera hasta 150 en calor/subidas; si pasa de 160 sostenido, camina.',
    why:
      note ??
      'Este es el entrenamiento que de verdad va a bajar tu FC en ritmos fáciles. Ve más lento de lo que creas necesario — el objetivo es la FC, no el número de ritmo.',
    selfRegulation: 'Debes poder hablar en frases completas. Si no puedes, vas demasiado rápido: para y camina hasta recuperar.',
  }
}

function longRun(id: string, km: string, note?: string): Session {
  return {
    id,
    slot: 'AM',
    type: 'running-long',
    title: `Fondo largo — ${km} km`,
    summary: `Fondo ${km} km`,
    distanceKm: km,
    pace: '7:30–8:30 /km, más lento al final si hace falta',
    hrTarget: 'Zona 2 predominante (122–141 ppm), con algo de deriva a Zona 3 baja hacia el final. Camina cuando lo pida el cuerpo.',
    why: note ?? 'Construye el volumen hacia los 21 km del 5 de agosto de forma progresiva y seguido de un día de descanso.',
    selfRegulation: 'Lleva agua (y algo de sal si son más de 60-70 min). Caminar en las subidas o cuando la FC se dispare es parte del plan, no un fracaso.',
  }
}

function swimTechnique(id: string): Session {
  return {
    id,
    slot: 'PM',
    type: 'swim-technique',
    title: 'Natación — técnica',
    summary: 'Nado técnica',
    distanceKm: '~0.6–0.7 km',
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

function swimEndurance(id: string, structure: string[], totalKm: string): Session {
  return {
    id,
    slot: 'PM',
    type: 'swim-endurance',
    title: 'Natación — resistencia',
    summary: 'Nado resistencia',
    distanceKm: totalKm,
    pace: '2:10–2:20 /100 m',
    structure,
    why: 'Progresión de distancia continua en el agua, construyendo resistencia poco a poco sin forzar la técnica.',
    selfRegulation: 'Si te falta el aire o pierdes la forma, baja el ritmo — la prioridad sigue siendo la técnica.',
  }
}

function flexSlot(id: string, sport: 'fútbol' | 'vóley', swimAlt: Session): Session {
  return {
    id,
    slot: 'PM',
    type: 'flex',
    title: `${sport === 'fútbol' ? 'Fútbol' : 'Vóley'} (si juegas) o natación`,
    summary: `${sport === 'fútbol' ? 'Fútbol' : 'Vóley'} / nado`,
    flexOptions: [sport === 'fútbol' ? 'Fútbol recreativo' : 'Vóley recreativo', swimAlt.title],
    why: `${sport === 'fútbol' ? 'El fútbol' : 'El vóley'} cuenta como sesión de alta intensidad/impacto. Si juegas esta semana, esta sesión la reemplaza — no se suma a la natación del mismo día.`,
    selfRegulation: 'Si jugaste fútbol o vóley esta semana, no agregues la natación de resistencia el mismo día — elige una de las dos.',
  }
}

export const PRINCIPLES: string[] = [
  'La FC manda, no el ritmo: en los rodajes fáciles, ve más lento de lo que creas necesario.',
  'Nunca apiles dos sesiones fuertes de pierna seguidas si lo puedes evitar — por eso el running de calidad no existe todavía, el funcional y el deporte ya cubren esa dosis.',
  'El fútbol y el vóley cuentan como sesión de alta intensidad: sustituyen una sesión de la semana, no se suman a todo lo demás.',
  'Dolor articular no es lo mismo que dolor muscular. El primero cancela la sesión; el segundo se maneja con foam roller y sigue el plan.',
  'Nunca se corre la distancia completa del objetivo justo antes del día clave — por eso el 1 de agosto el fondo se queda en 17–18 km, no en 21.',
  'Tu VO2máx (51) y tu FC en reposo (55) muestran que el motor está bien. Lo que falta es base aeróbica para usarlo a baja FC — eso se construye con constancia, no con velocidad.',
]

export const GOAL_DATE = '2026-08-05'
export const GOAL_DISTANCE_KM = 21

export const PLAN: DayPlan[] = [
  { date: '2026-07-15', weekday: weekdayOf('2026-07-15'), sessions: [crossfit('2026-07-15-am'), restPM('2026-07-15-pm')] },
  { date: '2026-07-16', weekday: weekdayOf('2026-07-16'), sessions: [crossfit('2026-07-16-am'), swimTechnique('2026-07-16-pm')] },
  {
    date: '2026-07-17',
    weekday: weekdayOf('2026-07-17'),
    sessions: [
      easyRun('2026-07-17-am', '5', 'Primer rodaje del plan: arranca conservador, la idea es sentir cómo baja la FC al ir más lento.'),
      flexSlot('2026-07-17-pm', 'fútbol', swimEndurance('2026-07-17-pm-swim', ['100 m calentamiento', '4×75 m @ 2:10–2:20/100m, descanso 20 s', '100 m suelta'], '~0.5 km')),
    ],
  },
  {
    date: '2026-07-18',
    weekday: weekdayOf('2026-07-18'),
    sessions: [longRun('2026-07-18-am', '10–11'), restPM('2026-07-18-pm', 'Descanso / recuperación')],
  },
  { date: '2026-07-19', weekday: weekdayOf('2026-07-19'), sessions: [restFullDay('2026-07-19')] },
  { date: '2026-07-20', weekday: weekdayOf('2026-07-20'), sessions: [crossfit('2026-07-20-am'), restPM('2026-07-20-pm')] },
  {
    date: '2026-07-21',
    weekday: weekdayOf('2026-07-21'),
    sessions: [
      easyRun('2026-07-21-am', '5'),
      flexSlot('2026-07-21-pm', 'vóley', swimTechnique('2026-07-21-pm-swim')),
    ],
  },
  { date: '2026-07-22', weekday: weekdayOf('2026-07-22'), sessions: [crossfit('2026-07-22-am'), restPM('2026-07-22-pm', 'Descanso total')] },
  { date: '2026-07-23', weekday: weekdayOf('2026-07-23'), sessions: [crossfit('2026-07-23-am'), swimTechnique('2026-07-23-pm')] },
  {
    date: '2026-07-24',
    weekday: weekdayOf('2026-07-24'),
    sessions: [
      easyRun('2026-07-24-am', '5'),
      flexSlot(
        '2026-07-24-pm',
        'fútbol',
        swimEndurance('2026-07-24-pm-swim', ['100 m calentamiento', '3×100 m @ 2:10–2:20/100m, descanso 20–25 s', '100 m suelta'], '~0.7 km'),
      ),
    ],
  },
  {
    date: '2026-07-25',
    weekday: weekdayOf('2026-07-25'),
    sessions: [longRun('2026-07-25-am', '14–15'), restPM('2026-07-25-pm', 'Descanso / recuperación')],
  },
  { date: '2026-07-26', weekday: weekdayOf('2026-07-26'), sessions: [restFullDay('2026-07-26')] },
  { date: '2026-07-27', weekday: weekdayOf('2026-07-27'), sessions: [crossfit('2026-07-27-am'), restPM('2026-07-27-pm')] },
  {
    date: '2026-07-28',
    weekday: weekdayOf('2026-07-28'),
    sessions: [
      easyRun('2026-07-28-am', '6'),
      flexSlot('2026-07-28-pm', 'vóley', swimTechnique('2026-07-28-pm-swim')),
    ],
  },
  { date: '2026-07-29', weekday: weekdayOf('2026-07-29'), sessions: [crossfit('2026-07-29-am'), restPM('2026-07-29-pm', 'Descanso total')] },
  { date: '2026-07-30', weekday: weekdayOf('2026-07-30'), sessions: [crossfit('2026-07-30-am'), swimTechnique('2026-07-30-pm')] },
  {
    date: '2026-07-31',
    weekday: weekdayOf('2026-07-31'),
    sessions: [
      easyRun('2026-07-31-am', '5'),
      flexSlot(
        '2026-07-31-pm',
        'fútbol',
        swimEndurance('2026-07-31-pm-swim', ['100 m calentamiento', '4×100 m @ 2:10–2:20/100m, descanso 20 s (más continuo)', '100 m suelta'], '~0.8–0.9 km'),
      ),
    ],
  },
  {
    date: '2026-08-01',
    weekday: weekdayOf('2026-08-01'),
    sessions: [
      longRun(
        '2026-08-01-am',
        '17–18',
        'Último fondo largo antes del intento de los 21 km. A propósito no llega a la distancia completa — nunca se corre el objetivo entero justo antes del día clave.',
      ),
      restPM('2026-08-01-pm', 'Descanso / recuperación'),
    ],
  },
  { date: '2026-08-02', weekday: weekdayOf('2026-08-02'), sessions: [restFullDay('2026-08-02')] },
  {
    date: '2026-08-03',
    weekday: weekdayOf('2026-08-03'),
    sessions: [
      crossfit('2026-08-03-am', 'Última sesión de funcional antes del intento de los 21 km — es un buen momento para pedirle a tu entrenador que baje el volumen de piernas (semana de taper).'),
      restPM('2026-08-03-pm'),
    ],
  },
  {
    date: '2026-08-04',
    weekday: weekdayOf('2026-08-04'),
    sessions: [
      {
        id: '2026-08-04-am',
        slot: 'AM',
        type: 'running-shakeout',
        title: 'Trote muy suave — 3–4 km (opcional)',
        summary: 'Shakeout suave',
        distanceKm: '3–4',
        pace: 'Muy suave, sin ninguna exigencia',
        hrTarget: 'Zona 1–2 baja (por debajo de 140 ppm)',
        why: 'Activa las piernas sin gastar energía antes del intento de los 21 km. Si sientes cualquier fatiga, es mejor descansar en su lugar.',
        selfRegulation: 'Esta sesión es prescindible: si las piernas no están al 100%, descansa en vez de trotar.',
      },
      restPM('2026-08-04-pm', 'Descanso / movilidad suave'),
    ],
  },
  {
    date: '2026-08-05',
    weekday: weekdayOf('2026-08-05'),
    note: 'Se reemplaza el funcional fijo de hoy por el intento de los 21 km — no hagas CrossFit este día.',
    sessions: [
      {
        id: '2026-08-05-goal',
        slot: 'AM',
        type: 'running-goal',
        title: '🎯 Intento de 21 km',
        summary: 'Meta: 21 km',
        distanceKm: '21',
        pace: 'Esfuerzo conversacional — sin meta de tiempo fija',
        hrTarget: 'Zona 2 predominante (122–141 ppm), tolerando Zona 3 (hasta ~155-160) en tramos finales. Camina cuando la FC lo pida.',
        why: 'Esta es la fecha que te marcaste, pero el objetivo real es terminar bien, en control de tu FC y sin lesión — no un ritmo exacto. Si sale a 6:30–7:00/km sin forzar, genial; si sale más lento, también es un éxito.',
        selfRegulation: 'Hidratación y algo de sal/energía desde antes de la hora. Si el cuerpo pide parar, para — no hay nada que demostrar forzando.',
        fixed: true,
      },
      restPM('2026-08-05-pm', 'Descanso total — te lo ganaste'),
    ],
  },
]

export function getDayPlan(date: string): DayPlan | undefined {
  return PLAN.find((d) => d.date === date)
}

export function todayISO(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
