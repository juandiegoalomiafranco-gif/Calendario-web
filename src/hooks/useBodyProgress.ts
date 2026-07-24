import { useCallback } from 'react'
import { createCollection, createSingleton, newId } from '../lib/cloudStore'
import type { BodyControl, BodyGoals } from '../data/bodyTypes'
import { DEFAULT_BODY_GOALS } from '../data/bodyTypes'

interface ControlRow {
  id: string
  date: string
  weight_kg: number | null
  imc: number | null
  fat_bioimp_pct: number | null
  fat_yuhasz_pct: number | null
  fat_mass_kg: number | null
  lean_mass_kg: number | null
  subescapular: number | null
  triceps: number | null
  biceps: number | null
  supraespinal: number | null
  cresta_iliaca: number | null
  abdominal: number | null
  muslo_anterior: number | null
  pantorrilla: number | null
  suma_8: number | null
  suma_6: number | null
  cintura: number | null
  cadera: number | null
  biceps_relajado: number | null
  biceps_contraido: number | null
  indice_cintura_cadera: number | null
  notes: string | null
}

const n = (v: number | null): number | undefined => (v == null ? undefined : v)

const controlsStore = createCollection<BodyControl, ControlRow>({
  key: 'mivida:body-controls:v1',
  table: 'body_controls',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    weightKg: n(r.weight_kg),
    imc: n(r.imc),
    fatBioimpPct: n(r.fat_bioimp_pct),
    fatYuhaszPct: n(r.fat_yuhasz_pct),
    fatMassKg: n(r.fat_mass_kg),
    leanMassKg: n(r.lean_mass_kg),
    subescapular: n(r.subescapular),
    triceps: n(r.triceps),
    biceps: n(r.biceps),
    supraespinal: n(r.supraespinal),
    crestaIliaca: n(r.cresta_iliaca),
    abdominal: n(r.abdominal),
    musloAnterior: n(r.muslo_anterior),
    pantorrilla: n(r.pantorrilla),
    suma8: n(r.suma_8),
    suma6: n(r.suma_6),
    cintura: n(r.cintura),
    cadera: n(r.cadera),
    bicepsRelajado: n(r.biceps_relajado),
    bicepsContraido: n(r.biceps_contraido),
    indiceCinturaCadera: n(r.indice_cintura_cadera),
    notes: r.notes ?? undefined,
  }),
  itemToRow: (c, userId) => ({
    id: c.id,
    user_id: userId,
    date: c.date,
    weight_kg: c.weightKg ?? null,
    imc: c.imc ?? null,
    fat_bioimp_pct: c.fatBioimpPct ?? null,
    fat_yuhasz_pct: c.fatYuhaszPct ?? null,
    fat_mass_kg: c.fatMassKg ?? null,
    lean_mass_kg: c.leanMassKg ?? null,
    subescapular: c.subescapular ?? null,
    triceps: c.triceps ?? null,
    biceps: c.biceps ?? null,
    supraespinal: c.supraespinal ?? null,
    cresta_iliaca: c.crestaIliaca ?? null,
    abdominal: c.abdominal ?? null,
    muslo_anterior: c.musloAnterior ?? null,
    pantorrilla: c.pantorrilla ?? null,
    suma_8: c.suma8 ?? null,
    suma_6: c.suma6 ?? null,
    cintura: c.cintura ?? null,
    cadera: c.cadera ?? null,
    biceps_relajado: c.bicepsRelajado ?? null,
    biceps_contraido: c.bicepsContraido ?? null,
    indice_cintura_cadera: c.indiceCinturaCadera ?? null,
    notes: c.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

interface GoalsRow {
  target_weight_kg: number | null
  target_suma_pliegues: number | null
  target_cintura_cm: number | null
  target_lean_mass_kg: number | null
  notes: string | null
}

const goalsStore = createSingleton<BodyGoals, GoalsRow>({
  key: 'mivida:body-goals:v1',
  table: 'body_goals',
  fallback: DEFAULT_BODY_GOALS,
  rowToValue: (r) => ({
    targetWeightKg: n(r.target_weight_kg),
    targetSumaPliegues: n(r.target_suma_pliegues),
    targetCinturaCm: n(r.target_cintura_cm),
    targetLeanMassKg: n(r.target_lean_mass_kg),
    notes: r.notes ?? undefined,
  }),
  valueToRow: (g, userId) => ({
    user_id: userId,
    target_weight_kg: g.targetWeightKg ?? null,
    target_suma_pliegues: g.targetSumaPliegues ?? null,
    target_cintura_cm: g.targetCinturaCm ?? null,
    target_lean_mass_kg: g.targetLeanMassKg ?? null,
    notes: g.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

export function useBodyControls() {
  const all = controlsStore.useAll()
  const controls = [...all].sort((a, b) => a.date.localeCompare(b.date))

  const saveControl = useCallback((control: Omit<BodyControl, 'id'> & { id?: string }) => {
    controlsStore.upsert({ ...control, id: control.id ?? newId() })
  }, [])

  const removeControl = useCallback((id: string) => {
    controlsStore.remove(id)
  }, [])

  return { controls, saveControl, removeControl }
}

export function useBodyGoals() {
  const goals = goalsStore.useValue()
  return { goals, setGoals: goalsStore.set }
}
