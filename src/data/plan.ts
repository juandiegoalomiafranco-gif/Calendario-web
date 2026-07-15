import type { DayPlan, Recovery, Session } from './types'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function weekdayOf(date: string): string {
  // date is YYYY-MM-DD, parsed as UTC to avoid local-timezone day shifts
  const d = new Date(`${date}T00:00:00Z`)
  return WEEKDAYS[d.getUTCDay()]
}

const CROSSFIT_SELF_REG =
  'Si traes piernas cargadas (de correr, fútbol o vóley), avísale a tu entrenador antes de empezar para que module el volumen de tren inferior de hoy.'

const SHOW_COACH =
  'Muéstrale este foco a tu profesor para estructurar la sesión — así ningún grupo muscular se carga dos días seguidos.'

type FocusKey = 'inferior' | 'pliometria' | 'superior' | 'taper'

const FUNCIONAL_FOCUS: Record<FocusKey, { focus: string; summary: string; structure: string[]; why: string }> = {
  inferior: {
    focus: 'Fortalecimiento — tren inferior',
    summary: 'Funcional · pierna',
    structure: [
      'Movilidad de cadera y tobillo, 8-10 min',
      'Fuerza: sentadilla / peso muerto / zancadas — 4-5 series',
      'Accesorio: hip thrust o step-ups — 3 series',
      'Core anti-rotación (press Pallof, plancha con arrastre) — 3 rondas',
      'Sin saltos hoy: la pliometría va el miércoles',
    ],
    why: `Hoy el funcional va de fuerza de pierna: es el día más lejano al fondo del sábado y vienes del descanso del domingo, así que es el momento seguro para pierna pesada. ${SHOW_COACH}`,
  },
  pliometria: {
    focus: 'Pliometría y potencia',
    summary: 'Funcional · pliometría',
    structure: [
      'Calentamiento con skipping y saltos progresivos, 8-10 min',
      'Saltos al cajón / salto vertical / bounds — 4-6 series de pocas reps (calidad, no fatiga)',
      'Potencia: kettlebell swings o lanzamientos de balón medicinal — 3-4 series',
      'Metcon corto opcional 8-10 min, sin sobrecargar pierna',
      'Core dinámico (mountain climbers, hollow rocks) — 3 rondas',
    ],
    why: `Hoy toca explosividad: saltos y potencia de calidad, que mejoran tu economía de carrera y tu rendimiento en vóley y fútbol. Faltan 3 días para el fondo, hay tiempo de sobra para recuperar. ${SHOW_COACH}`,
  },
  superior: {
    focus: 'Fortalecimiento — tren superior + core',
    summary: 'Funcional · superior',
    structure: [
      'Movilidad de hombro y escápula, 8 min',
      'Empuje: press banca / press hombro / fondos — 4 series',
      'Tracción: dominadas / remo — 4 series',
      'Accesorios de brazo y hombro — 2-3 series',
      'Core: hollow hold, press Pallof — 3 rondas',
      'Cero pierna pesada: mañana rodaje y el sábado fondo largo',
    ],
    why: `Hoy el funcional es de tren superior y core: cero pierna pesada, porque mañana hay rodaje y el sábado viene el fondo largo — así llegas con piernas frescas. ${SHOW_COACH}`,
  },
  taper: {
    focus: 'Full body suave — taper',
    summary: 'Funcional · taper',
    structure: [
      'Movilidad general, 10 min',
      'Circuito full body liviano con foco en técnica — 2-3 rondas suaves',
      'Sin pierna pesada ni saltos',
      'Core suave — 2 rondas',
    ],
    why: `Semana de taper: el funcional de hoy es liviano para llegar fresco al intento de los 21 km. ${SHOW_COACH}`,
  },
}

function crossfit(id: string, focusKey: FocusKey, note?: string): Session {
  const f = FUNCIONAL_FOCUS[focusKey]
  return {
    id,
    slot: 'AM',
    type: 'crossfit',
    title: 'Funcional / CrossFit con entrenador',
    summary: f.summary,
    focus: f.focus,
    structure: f.structure,
    fixed: true,
    why: note ?? f.why,
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
    why: 'Después de una sesión fuerte por la mañana, la tarde es para recuperar: estiramiento suave o simplemente descansar. No agregues carga nueva — el foam roller del día ya está abajo en tu checklist.',
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

function roller(title: string, detail: string): Recovery {
  return { title, detail }
}

// Foam roller del día, con foco acorde a la carga de cada día de la semana
const ROLLER_LUN = roller('Foam roller — cuádriceps y glúteos', '10 min por la tarde, después del funcional de pierna.')
const ROLLER_MAR = roller('Foam roller — pantorrillas y cuádriceps', '10 min después de la actividad de la tarde.')
const ROLLER_MIE = roller('Foam roller — pantorrillas y tibiales', '10 min, suave después de la pliometría.')
const ROLLER_JUE = roller('Foam roller — espalda alta y dorsales', '10 min, con una pasada suave de piernas.')
const ROLLER_VIE = roller('Foam roller — piernas completas', '10 min después del rodaje o del partido.')
const ROLLER_SAB = roller('Foam roller — piernas completas', '15 min, muy suave después del fondo largo.')
const ROLLER_DOM = roller('Foam roller suave — cuerpo completo (opcional)', '10 min si sientes el cuerpo cargado; si no, descansa.')

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
  {
    date: '2026-07-15',
    weekday: weekdayOf('2026-07-15'),
    sessions: [crossfit('2026-07-15-am', 'pliometria'), restPM('2026-07-15-pm')],
    recovery: ROLLER_MIE,
  },
  {
    date: '2026-07-16',
    weekday: weekdayOf('2026-07-16'),
    sessions: [crossfit('2026-07-16-am', 'superior'), swimTechnique('2026-07-16-pm')],
    recovery: ROLLER_JUE,
  },
  {
    date: '2026-07-17',
    weekday: weekdayOf('2026-07-17'),
    sessions: [
      easyRun('2026-07-17-am', '5', 'Primer rodaje del plan: arranca conservador, la idea es sentir cómo baja la FC al ir más lento.'),
      flexSlot('2026-07-17-pm', 'fútbol', swimEndurance('2026-07-17-pm-swim', ['100 m calentamiento', '4×75 m @ 2:10–2:20/100m, descanso 20 s', '100 m suelta'], '~0.5 km')),
    ],
    recovery: ROLLER_VIE,
  },
  {
    date: '2026-07-18',
    weekday: weekdayOf('2026-07-18'),
    sessions: [longRun('2026-07-18-am', '10–11'), restPM('2026-07-18-pm', 'Descanso / recuperación')],
    recovery: ROLLER_SAB,
  },
  { date: '2026-07-19', weekday: weekdayOf('2026-07-19'), sessions: [restFullDay('2026-07-19')], recovery: ROLLER_DOM },
  {
    date: '2026-07-20',
    weekday: weekdayOf('2026-07-20'),
    sessions: [crossfit('2026-07-20-am', 'inferior'), restPM('2026-07-20-pm')],
    recovery: ROLLER_LUN,
  },
  {
    date: '2026-07-21',
    weekday: weekdayOf('2026-07-21'),
    sessions: [
      easyRun('2026-07-21-am', '5'),
      flexSlot('2026-07-21-pm', 'vóley', swimTechnique('2026-07-21-pm-swim')),
    ],
    recovery: ROLLER_MAR,
  },
  {
    date: '2026-07-22',
    weekday: weekdayOf('2026-07-22'),
    sessions: [crossfit('2026-07-22-am', 'pliometria'), restPM('2026-07-22-pm', 'Descanso total')],
    recovery: ROLLER_MIE,
  },
  {
    date: '2026-07-23',
    weekday: weekdayOf('2026-07-23'),
    sessions: [crossfit('2026-07-23-am', 'superior'), swimTechnique('2026-07-23-pm')],
    recovery: ROLLER_JUE,
  },
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
    recovery: ROLLER_VIE,
  },
  {
    date: '2026-07-25',
    weekday: weekdayOf('2026-07-25'),
    sessions: [longRun('2026-07-25-am', '14–15'), restPM('2026-07-25-pm', 'Descanso / recuperación')],
    recovery: ROLLER_SAB,
  },
  { date: '2026-07-26', weekday: weekdayOf('2026-07-26'), sessions: [restFullDay('2026-07-26')], recovery: ROLLER_DOM },
  {
    date: '2026-07-27',
    weekday: weekdayOf('2026-07-27'),
    sessions: [crossfit('2026-07-27-am', 'inferior'), restPM('2026-07-27-pm')],
    recovery: ROLLER_LUN,
  },
  {
    date: '2026-07-28',
    weekday: weekdayOf('2026-07-28'),
    sessions: [
      easyRun('2026-07-28-am', '6'),
      flexSlot('2026-07-28-pm', 'vóley', swimTechnique('2026-07-28-pm-swim')),
    ],
    recovery: ROLLER_MAR,
  },
  {
    date: '2026-07-29',
    weekday: weekdayOf('2026-07-29'),
    sessions: [crossfit('2026-07-29-am', 'pliometria'), restPM('2026-07-29-pm', 'Descanso total')],
    recovery: ROLLER_MIE,
  },
  {
    date: '2026-07-30',
    weekday: weekdayOf('2026-07-30'),
    sessions: [crossfit('2026-07-30-am', 'superior'), swimTechnique('2026-07-30-pm')],
    recovery: ROLLER_JUE,
  },
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
    recovery: ROLLER_VIE,
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
    recovery: ROLLER_SAB,
  },
  { date: '2026-08-02', weekday: weekdayOf('2026-08-02'), sessions: [restFullDay('2026-08-02')], recovery: ROLLER_DOM },
  {
    date: '2026-08-03',
    weekday: weekdayOf('2026-08-03'),
    sessions: [
      crossfit(
        '2026-08-03-am',
        'taper',
        'Última sesión de funcional antes del intento de los 21 km — es un buen momento para pedirle a tu entrenador que baje el volumen de piernas (semana de taper).',
      ),
      restPM('2026-08-03-pm'),
    ],
    recovery: roller('Foam roller — pasada suave de piernas', '10 min, sin presión fuerte: semana de taper.'),
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
    recovery: roller('Foam roller — pasada muy suave de piernas', '8-10 min, solo para soltar; nada de presión profunda antes del día clave.'),
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
    recovery: roller('Foam roller — recuperación post-21K', '15 min muy suaves por la tarde: piernas completas, sin buscar dolor.'),
  },
]

export function getDayPlan(date: string): DayPlan | undefined {
  return PLAN.find((d) => d.date === date)
}

export function todayISO(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
