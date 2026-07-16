import { useCallback, useSyncExternalStore } from 'react'
import type { CustomActivity, DayPlan, Session, Slot } from '../data/types'

const STORAGE_KEY = 'calendario-web:custom:v1'

function readStorage(): CustomActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as CustomActivity[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Almacén compartido a nivel de módulo (ver nota en useTrainingLog.ts):
// añadir una actividad desde el formulario refresca al instante la lista
// del día y la semana, y la escritura nunca pisa datos de otro componente.
let state: CustomActivity[] = readStorage()
const listeners = new Set<() => void>()

function setState(next: CustomActivity[]) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage lleno o bloqueado: seguimos en memoria
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): CustomActivity[] {
  return state
}

export function useCustomActivities() {
  const activities = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const forDate = useCallback(
    (date: string): CustomActivity[] => activities.filter((a) => a.date === date),
    [activities],
  )

  const add = useCallback((a: Omit<CustomActivity, 'id'>): string => {
    const id = `custom-${Date.now()}`
    setState([...state, { ...a, id }])
    return id
  }, [])

  const remove = useCallback((id: string) => {
    setState(state.filter((a) => a.id !== id))
  }, [])

  return { activities, forDate, add, remove }
}

export function customToSession(a: CustomActivity): Session {
  const isFutbol = a.kind === 'futbol'
  return {
    id: a.id,
    slot: a.slot,
    type: a.kind,
    title: isFutbol ? 'Fútbol (agregado por ti)' : 'Vóley (agregado por ti)',
    summary: isFutbol ? 'Fútbol' : 'Vóley',
    why: 'Actividad que agregaste tú. Cuenta como sesión de alta intensidad/impacto: si la juegas, reemplaza la natación de resistencia o el flex del día — no la sumes a todo lo demás.',
    selfRegulation: a.note || undefined,
  }
}

const SLOT_ORDER: Record<Slot, number> = { AM: 0, ALL: 1, PM: 2 }

export function mergeDay(day: DayPlan, customs: CustomActivity[]): DayPlan {
  if (!customs.length) return day
  const extra = customs.map(customToSession)
  return {
    ...day,
    sessions: [...day.sessions, ...extra].sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]),
  }
}
