import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Goal, GoalSport } from '../data/types'
import { supabase } from '../lib/supabase'
import { createCloudStore, reportWrite } from '../lib/cloudStore'
import { todayISO } from '../lib/dates'

const SEED_KEY = 'calendario-web:goals:seeded'

// La meta que antes estaba escrita en el código. Se siembra una sola vez para
// no perder la cuenta regresiva; la marca evita que reaparezca si la borras.
const SEED_GOAL = { title: 'Intento de 21 km', sport: 'running' as GoalSport, targetKm: 21, targetDate: '2026-08-05' }

interface Row {
  id: string
  title: string
  sport: string
  target_km: number | null
  target_date: string
  achieved: boolean
  created_at: string
}

function rowToGoal(r: Row): Goal {
  return {
    id: r.id,
    title: r.title,
    sport: (r.sport as GoalSport) ?? 'running',
    targetKm: r.target_km ?? undefined,
    targetDate: r.target_date,
    achieved: r.achieved,
    createdAt: r.created_at,
  }
}

function goalToRow(userId: string, g: Goal) {
  return {
    id: g.id,
    user_id: userId,
    title: g.title,
    sport: g.sport,
    target_km: g.targetKm ?? null,
    target_date: g.targetDate,
    achieved: g.achieved,
    created_at: g.createdAt,
    updated_at: new Date().toISOString(),
  }
}

function byDate(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate))
}

const store = createCloudStore<Goal[]>({
  storageKey: 'calendario-web:goals:v1',
  initial: [],
  hydrate: (raw) => (Array.isArray(raw) ? byDate(raw as Goal[]) : []),
  load: async (userId, local) => {
    const { data, error } = await supabase.from('goals').select('*').order('target_date')
    // Si la tabla todavía no existe, la app sigue funcionando con la caché local.
    if (error || !data) return null

    const cloud = (data as Row[]).map(rowToGoal)
    // Primera sincronización: si la nube está vacía y aquí hay metas, se suben en
    // vez de borrarse. (Después manda la nube: fusionar por meta resucitaría las
    // que borraste desde otro dispositivo.)
    if (cloud.length === 0 && local.length > 0) {
      for (const goal of local) pushGoal(goal, userId)
      return local
    }
    return cloud
  },
})

function pushGoal(goal: Goal, userId?: string) {
  const id = userId ?? store.userId()
  if (!id) return
  void supabase
    .from('goals')
    .upsert(goalToRow(id, goal), { onConflict: 'id' })
    .then(({ error }) => reportWrite(error, 'la meta'))
}

function deleteGoalRow(id: string) {
  if (!store.userId()) return
  void supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .then(({ error }) => reportWrite(error, 'el borrado de la meta'))
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Siembra la meta original la primera vez, ya con la nube consultada. */
async function seedDefaultGoal() {
  try {
    if (localStorage.getItem(SEED_KEY)) return
    await store.ready
    if (store.snapshot().length === 0) {
      const goal: Goal = { id: newId(), ...SEED_GOAL, achieved: false, createdAt: new Date().toISOString() }
      store.setLocal([goal])
      pushGoal(goal)
    }
    localStorage.setItem(SEED_KEY, '1')
  } catch {
    // modo privado sin localStorage: no pasa nada, simplemente no se siembra
  }
}

export interface NewGoal {
  title: string
  sport: GoalSport
  targetKm?: number
  targetDate: string
}

export function useGoals() {
  const goals = useSyncExternalStore(store.subscribe, store.snapshot)

  useEffect(() => {
    void seedDefaultGoal()
  }, [])

  /** La próxima meta por cumplir: la de fecha más cercana que no haya pasado. */
  const activeGoal = useMemo(() => {
    const today = todayISO()
    return byDate(goals).find((g) => !g.achieved && g.targetDate >= today)
  }, [goals])

  const addGoal = useCallback((data: NewGoal): Goal => {
    const goal: Goal = { id: newId(), ...data, achieved: false, createdAt: new Date().toISOString() }
    store.setLocal(byDate([...store.snapshot(), goal]))
    pushGoal(goal)
    return goal
  }, [])

  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    const current = store.snapshot()
    const next = current.map((g) => (g.id === id ? { ...g, ...patch } : g))
    store.setLocal(byDate(next))
    const updated = next.find((g) => g.id === id)
    if (updated) pushGoal(updated)
  }, [])

  const removeGoal = useCallback((id: string) => {
    store.setLocal(store.snapshot().filter((g) => g.id !== id))
    deleteGoalRow(id)
  }, [])

  return { goals: byDate(goals), activeGoal, addGoal, updateGoal, removeGoal }
}
