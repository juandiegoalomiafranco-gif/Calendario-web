// Medidas corporales: métricas, controles del entrenador (seeds) y fórmulas.
// Los valores derivados (sumas de pliegues, % Yuhasz, IMC) nunca se almacenan:
// se calculan al vuelo para que una edición no deje datos obsoletos.

export const HEIGHT_CM = 176

export type MetricKey =
  | 'peso'
  | 'grasaBio'
  | 'pSubescapular'
  | 'pTriceps'
  | 'pBiceps'
  | 'pSupraespinal'
  | 'pCrestaIliaca'
  | 'pAbdominal'
  | 'pMuslo'
  | 'pPantorrilla'
  | 'cintura'
  | 'cadera'
  | 'bicepsContraido'

export type MetricGroup = 'basicos' | 'pliegues' | 'perimetros'
export type GoodDirection = 'down' | 'up' | 'stable'

export interface MetricDef {
  key: MetricKey
  label: string
  shortLabel: string
  unit: 'kg' | '%' | 'mm' | 'cm'
  group: MetricGroup
  step: number
  min: number
  max: number
  decimals: number
  good: GoodDirection
}

function pliegue(key: MetricKey, name: string, max = 45): MetricDef {
  return {
    key,
    label: `Pliegue ${name.toLowerCase()}`,
    shortLabel: name,
    unit: 'mm',
    group: 'pliegues',
    step: 0.5,
    min: 3,
    max,
    decimals: 1,
    good: 'down',
  }
}

export const METRICS: Record<MetricKey, MetricDef> = {
  peso: { key: 'peso', label: 'Peso', shortLabel: 'Peso', unit: 'kg', group: 'basicos', step: 0.1, min: 55, max: 100, decimals: 1, good: 'down' },
  grasaBio: { key: 'grasaBio', label: 'Grasa bioimpedancia', shortLabel: 'Grasa bio', unit: '%', group: 'basicos', step: 0.1, min: 5, max: 40, decimals: 1, good: 'down' },
  pSubescapular: pliegue('pSubescapular', 'Subescapular'),
  pTriceps: pliegue('pTriceps', 'Tríceps'),
  pBiceps: pliegue('pBiceps', 'Bíceps'),
  pSupraespinal: pliegue('pSupraespinal', 'Supraespinal'),
  pCrestaIliaca: pliegue('pCrestaIliaca', 'Cresta ilíaca'),
  pAbdominal: pliegue('pAbdominal', 'Abdominal'),
  pMuslo: pliegue('pMuslo', 'Muslo anterior', 50),
  pPantorrilla: pliegue('pPantorrilla', 'Pantorrilla'),
  cintura: { key: 'cintura', label: 'Cintura', shortLabel: 'Cintura', unit: 'cm', group: 'perimetros', step: 0.5, min: 60, max: 110, decimals: 1, good: 'down' },
  cadera: { key: 'cadera', label: 'Cadera', shortLabel: 'Cadera', unit: 'cm', group: 'perimetros', step: 0.5, min: 80, max: 120, decimals: 1, good: 'stable' },
  bicepsContraido: { key: 'bicepsContraido', label: 'Bíceps contraído', shortLabel: 'Bíceps', unit: 'cm', group: 'perimetros', step: 0.5, min: 25, max: 45, decimals: 1, good: 'up' },
}

export const METRIC_ORDER: MetricKey[] = [
  'peso',
  'grasaBio',
  'pSubescapular',
  'pTriceps',
  'pBiceps',
  'pSupraespinal',
  'pCrestaIliaca',
  'pAbdominal',
  'pMuslo',
  'pPantorrilla',
  'cintura',
  'cadera',
  'bicepsContraido',
]

export const PLIEGUES_6: MetricKey[] = ['pTriceps', 'pSubescapular', 'pSupraespinal', 'pAbdominal', 'pMuslo', 'pPantorrilla']
export const PLIEGUES_8: MetricKey[] = [...PLIEGUES_6, 'pBiceps', 'pCrestaIliaca']

export type ControlValues = Partial<Record<MetricKey, number>>

export interface Control {
  id: string // seeds: 'seed-<fecha>'; usuario: 'user-<timestamp>'
  date: string // YYYY-MM-DD
  source: 'entrenador' | 'usuario'
  values: ControlValues
  notes?: string
}

function sumIfComplete(values: ControlValues, keys: MetricKey[]): number | undefined {
  let total = 0
  for (const k of keys) {
    const v = values[k]
    if (v === undefined) return undefined
    total += v
  }
  return total
}

export function suma6(values: ControlValues): number | undefined {
  return sumIfComplete(values, PLIEGUES_6)
}

export function suma8(values: ControlValues): number | undefined {
  return sumIfComplete(values, PLIEGUES_8)
}

// Fórmula Yuhasz (hombres) con la que trabaja el entrenador: suma6 × 0.1051 + 2.585
export function yuhasz(values: ControlValues): number | undefined {
  const s6 = suma6(values)
  return s6 === undefined ? undefined : s6 * 0.1051 + 2.585
}

export function imc(values: ControlValues): number | undefined {
  const peso = values.peso
  if (peso === undefined) return undefined
  const m = HEIGHT_CM / 100
  return peso / (m * m)
}

export interface Derived {
  suma6?: number
  suma8?: number
  yuhasz?: number
  imc?: number
}

export function derive(control: Control): Derived {
  return {
    suma6: suma6(control.values),
    suma8: suma8(control.values),
    yuhasz: yuhasz(control.values),
    imc: imc(control.values),
  }
}

export type DerivedKey = keyof Derived

// Cinco controles del "Reporte Comparativo" del entrenador (enero–julio 2026).
// Solo lectura: viven en código, nunca en localStorage.
export const SEED_CONTROLS: Control[] = [
  {
    id: 'seed-2026-01-14',
    date: '2026-01-14',
    source: 'entrenador',
    values: { peso: 77.3, grasaBio: 22.9, cintura: 82.5, cadera: 102, bicepsContraido: 36 },
    notes: 'Primer control del año. No se registraron todos los pliegues, por eso este control no tiene % Yuhasz.',
  },
  {
    id: 'seed-2026-01-28',
    date: '2026-01-28',
    source: 'entrenador',
    values: {
      peso: 74.8,
      grasaBio: 19.9,
      pSubescapular: 11,
      pTriceps: 20.5,
      pBiceps: 9,
      pSupraespinal: 15.5,
      pCrestaIliaca: 14,
      pAbdominal: 22.5,
      pMuslo: 32,
      pPantorrilla: 17,
      cintura: 82,
      cadera: 98,
      bicepsContraido: 35,
    },
  },
  {
    id: 'seed-2026-02-26',
    date: '2026-02-26',
    source: 'entrenador',
    values: {
      peso: 72.0,
      grasaBio: 17.1,
      pSubescapular: 11,
      pTriceps: 18,
      pBiceps: 8,
      pSupraespinal: 12.5,
      pCrestaIliaca: 13,
      pAbdominal: 17.5,
      pMuslo: 28,
      pPantorrilla: 15,
      cintura: 78.5,
      cadera: 97,
      bicepsContraido: 35.5,
    },
    notes: 'Mejor registro de peso del año (72.0 kg).',
  },
  {
    id: 'seed-2026-04-29',
    date: '2026-04-29',
    source: 'entrenador',
    values: {
      peso: 73.2,
      grasaBio: 19.2,
      pSubescapular: 11.5,
      pTriceps: 15,
      pBiceps: 6.5,
      pSupraespinal: 12,
      pCrestaIliaca: 12,
      pAbdominal: 19,
      pMuslo: 21.5,
      pPantorrilla: 12,
      cintura: 79,
      cadera: 96.5,
      bicepsContraido: 35.5,
    },
    notes: 'Mejor registro de pliegues del año (12.1 % Yuhasz).',
  },
  {
    id: 'seed-2026-07-09',
    date: '2026-07-09',
    source: 'entrenador',
    values: {
      peso: 72.6,
      grasaBio: 19.5,
      pSubescapular: 13.5,
      pTriceps: 19.5,
      pBiceps: 8,
      pSupraespinal: 14,
      pCrestaIliaca: 16,
      pAbdominal: 20.5,
      pMuslo: 24.5,
      pPantorrilla: 12,
      cintura: 79,
      cadera: 97,
      bicepsContraido: 34,
    },
    notes:
      'Lectura del entrenador: el peso bajó levemente pero los pliegues subieron y el brazo se redujo. El plan: retomar la constancia en fuerza (3-4 sesiones semanales), asegurar proteína en cada comida y volver a medir en 3-4 semanas.',
  },
]

export interface GoalDef {
  id: string
  title: string
  description: string
  metric: MetricKey | DerivedKey
  target: number
  comparator: 'lt' | 'gte'
  unit: string
}

// Metas del próximo control, definidas por el entrenador en el reporte de julio.
export const MEASUREMENT_GOALS: GoalDef[] = [
  {
    id: 'suma8',
    title: 'Suma de 8 pliegues',
    description: 'Volver a bajar la suma de pliegues: en abril estabas en 109.5 mm.',
    metric: 'suma8',
    target: 115,
    comparator: 'lt',
    unit: 'mm',
  },
  {
    id: 'bicepsContraido',
    title: 'Bíceps contraído',
    description: 'Recuperar el volumen del brazo con constancia en fuerza y proteína.',
    metric: 'bicepsContraido',
    target: 35,
    comparator: 'gte',
    unit: 'cm',
  },
]

// "Volver a medir en 3-4 semanas" (reporte del entrenador)
export const NEXT_CONTROL_WEEKS: [number, number] = [3, 4]

export function metricValue(control: Control, metric: MetricKey | DerivedKey): number | undefined {
  if (metric in METRICS) return control.values[metric as MetricKey]
  return derive(control)[metric as DerivedKey]
}

export function formatValue(v: number, decimals = 1): string {
  return v.toFixed(decimals).replace('.', ',')
}

const LONG_DATE = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const SHORT_DATE = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function formatDateLong(iso: string): string {
  return LONG_DATE.format(new Date(`${iso}T00:00:00Z`))
}

export function formatDateShort(iso: string): string {
  return SHORT_DATE.format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
}
