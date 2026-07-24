import { useCallback } from 'react'
import { createCollection, newId } from '../lib/cloudStore'
import type { ScenarioCode } from '../data/nutrition'

export interface NutritionDay {
  id: string
  date: string
  scenarioOverride?: ScenarioCode
  mealsDone: string[]
  notes?: string
}

interface NutritionRow {
  id: string
  date: string
  scenario_override: string | null
  meals_done: string[] | null
  notes: string | null
}

const store = createCollection<NutritionDay, NutritionRow>({
  key: 'mivida:nutrition-log:v1',
  table: 'nutrition_log',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    scenarioOverride: (r.scenario_override as ScenarioCode) ?? undefined,
    mealsDone: r.meals_done ?? [],
    notes: r.notes ?? undefined,
  }),
  itemToRow: (d, userId) => ({
    id: d.id,
    user_id: userId,
    date: d.date,
    scenario_override: d.scenarioOverride ?? null,
    meals_done: d.mealsDone,
    notes: d.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

function forDate(date: string): NutritionDay {
  return store.get().find((d) => d.date === date) ?? { id: newId(), date, mealsDone: [] }
}

export function useNutritionDay(date: string) {
  const all = store.useAll()
  const day = all.find((d) => d.date === date) ?? { id: '', date, mealsDone: [] as string[] }

  const toggleMeal = useCallback(
    (mealId: string) => {
      const current = forDate(date)
      const done = current.mealsDone.includes(mealId)
        ? current.mealsDone.filter((m) => m !== mealId)
        : [...current.mealsDone, mealId]
      store.upsert({ ...current, mealsDone: done })
    },
    [date],
  )

  const setOverride = useCallback(
    (code: ScenarioCode | undefined) => {
      const current = forDate(date)
      store.upsert({ ...current, scenarioOverride: code })
    },
    [date],
  )

  return { mealsDone: day.mealsDone, scenarioOverride: day.scenarioOverride, toggleMeal, setOverride }
}
