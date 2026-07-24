export interface BodyControl {
  id: string
  date: string // YYYY-MM-DD
  weightKg?: number
  imc?: number
  fatBioimpPct?: number
  fatYuhaszPct?: number
  fatMassKg?: number
  leanMassKg?: number
  // Pliegues (mm)
  subescapular?: number
  triceps?: number
  biceps?: number
  supraespinal?: number
  crestaIliaca?: number
  abdominal?: number
  musloAnterior?: number
  pantorrilla?: number
  suma8?: number
  suma6?: number
  // Perímetros (cm)
  cintura?: number
  cadera?: number
  bicepsRelajado?: number
  bicepsContraido?: number
  indiceCinturaCadera?: number
  notes?: string
}

export interface BodyGoals {
  targetWeightKg?: number
  targetSumaPliegues?: number
  targetCinturaCm?: number
  targetLeanMassKg?: number
  notes?: string
}

/** Línea base (control 9-jul-2026 con Diego). Se siembra si no hay controles. */
export const BASELINE_CONTROL: Omit<BodyControl, 'id'> = {
  date: '2026-07-09',
  weightKg: 72.6,
  imc: 23.4,
  fatBioimpPct: 19.5,
  fatYuhaszPct: 13.5,
  fatMassKg: 14.2,
  leanMassKg: 58.4,
  subescapular: 13.5,
  triceps: 19.5,
  biceps: 8,
  supraespinal: 14,
  crestaIliaca: 16,
  abdominal: 20.5,
  musloAnterior: 24.5,
  pantorrilla: 12,
  suma8: 128,
  suma6: 104,
  cintura: 79,
  cadera: 97,
  bicepsRelajado: 31,
  bicepsContraido: 34,
  indiceCinturaCadera: 0.81,
  notes: 'Línea base con Diego.',
}

/** Metas por defecto (editables): recomposición manteniendo cintura. */
export const DEFAULT_BODY_GOALS: BodyGoals = {
  targetWeightKg: undefined,
  targetSumaPliegues: 110,
  targetCinturaCm: 79,
  targetLeanMassKg: 60,
  notes: 'Bajar suma de pliegues y subir masa magra, manteniendo cintura ~79 cm.',
}

export const SKINFOLDS: { key: keyof BodyControl; label: string }[] = [
  { key: 'subescapular', label: 'Subescapular' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'supraespinal', label: 'Supraespinal' },
  { key: 'crestaIliaca', label: 'Cresta ilíaca' },
  { key: 'abdominal', label: 'Abdominal' },
  { key: 'musloAnterior', label: 'Muslo ant.' },
  { key: 'pantorrilla', label: 'Pantorrilla' },
]

export const GIRTHS: { key: keyof BodyControl; label: string }[] = [
  { key: 'cintura', label: 'Cintura' },
  { key: 'cadera', label: 'Cadera' },
  { key: 'bicepsRelajado', label: 'Bíceps relajado' },
  { key: 'bicepsContraido', label: 'Bíceps contraído' },
]

export const COMPOSITION: { key: keyof BodyControl; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'imc', label: 'IMC', unit: '' },
  { key: 'fatBioimpPct', label: '% grasa (bioimp.)', unit: '%' },
  { key: 'fatYuhaszPct', label: '% grasa (Yuhasz)', unit: '%' },
  { key: 'fatMassKg', label: 'Masa grasa', unit: 'kg' },
  { key: 'leanMassKg', label: 'Masa magra', unit: 'kg' },
]
