import { useCallback } from 'react'
import { createCollection, newId } from '../lib/cloudStore'

export interface StrengthSet {
  id: string
  sessionId?: string
  exercise: string
  setNumber: number
  reps?: number
  weightKg?: number
  date: string
  isPr: boolean
  notes?: string
}

export interface Exercise {
  id: string
  name: string
}

interface SetRow {
  id: string
  session_id: string | null
  exercise: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  date: string
  is_pr: boolean | null
  notes: string | null
}

interface ExerciseRow {
  id: string
  name: string
}

const setsStore = createCollection<StrengthSet, SetRow>({
  key: 'mivida:strength-logs:v1',
  table: 'strength_logs',
  rowToItem: (r) => ({
    id: r.id,
    sessionId: r.session_id ?? undefined,
    exercise: r.exercise,
    setNumber: r.set_number,
    reps: r.reps ?? undefined,
    weightKg: r.weight_kg ?? undefined,
    date: r.date,
    isPr: r.is_pr ?? false,
    notes: r.notes ?? undefined,
  }),
  itemToRow: (s, userId) => ({
    id: s.id,
    user_id: userId,
    session_id: s.sessionId ?? null,
    exercise: s.exercise,
    set_number: s.setNumber,
    reps: s.reps ?? null,
    weight_kg: s.weightKg ?? null,
    date: s.date,
    is_pr: s.isPr,
    notes: s.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

const exercisesStore = createCollection<Exercise, ExerciseRow>({
  key: 'mivida:exercises:v1',
  table: 'exercises',
  rowToItem: (r) => ({ id: r.id, name: r.name }),
  itemToRow: (e, userId) => ({ id: e.id, user_id: userId, name: e.name }),
})

/** Mejor marca (peso máximo) por ejercicio a partir de los sets registrados. */
export function bestByExercise(sets: StrengthSet[]): Map<string, number> {
  const best = new Map<string, number>()
  for (const s of sets) {
    if (s.weightKg == null) continue
    best.set(s.exercise, Math.max(best.get(s.exercise) ?? 0, s.weightKg))
  }
  return best
}

export function useStrength() {
  const sets = setsStore.useAll()
  const exercises = exercisesStore.useAll()

  const addSet = useCallback((set: Omit<StrengthSet, 'id' | 'isPr'>) => {
    // PR = peso mayor que el máximo previo registrado para ese ejercicio.
    const prevBest = bestByExercise(setsStore.get()).get(set.exercise) ?? 0
    const isPr = set.weightKg != null && set.weightKg > prevBest
    setsStore.upsert({ ...set, id: newId(), isPr })
  }, [])

  const removeSet = useCallback((id: string) => {
    setsStore.remove(id)
  }, [])

  const addExercise = useCallback((name: string) => {
    const clean = name.trim()
    if (!clean) return
    if (exercisesStore.get().some((e) => e.name.toLowerCase() === clean.toLowerCase())) return
    exercisesStore.upsert({ id: newId(), name: clean })
  }, [])

  const removeExercise = useCallback((id: string) => {
    exercisesStore.remove(id)
  }, [])

  return { sets, exercises, addSet, removeSet, addExercise, removeExercise }
}
