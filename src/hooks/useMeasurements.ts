import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { METRICS, SEED_CONTROLS } from '../data/measurements'
import type { Control, ControlValues, DerivedKey, MetricKey } from '../data/measurements'
import { metricValue } from '../data/measurements'

const STORAGE_KEY = 'calendario-web:medidas:v1'

type ControlMap = Record<string, Control>

function readStorage(): ControlMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ControlMap) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

// Almacén compartido a nivel de módulo con persistencia síncrona (ver nota en
// useTrainingLog.ts). El wizard guarda y navega en el mismo handler: la
// escritura tiene que ocurrir antes de que el componente se desmonte.
let state: ControlMap = readStorage()
const listeners = new Set<() => void>()

function setState(next: ControlMap) {
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

function getSnapshot(): ControlMap {
  return state
}

// Redondea cada valor al step de su métrica para evitar deriva de flotantes
function roundValues(values: ControlValues): ControlValues {
  const out: ControlValues = {}
  for (const [k, v] of Object.entries(values) as [MetricKey, number | undefined][]) {
    if (v === undefined || Number.isNaN(v)) continue
    const def = METRICS[k]
    const clamped = Math.min(def.max, Math.max(def.min, v))
    out[k] = Number((Math.round(clamped / def.step) * def.step).toFixed(def.decimals))
  }
  return out
}

export function useMeasurements() {
  const userControls = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const controls = useMemo<Control[]>(() => {
    const merged = [...SEED_CONTROLS, ...Object.values(userControls)]
    return merged.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1))
  }, [userControls])

  const addControl = useCallback((data: { date: string; values: ControlValues; notes?: string }): string => {
    const id = `user-${Date.now()}`
    const control: Control = {
      id,
      date: data.date,
      source: 'usuario',
      values: roundValues(data.values),
      notes: data.notes?.trim() || undefined,
    }
    setState({ ...state, [id]: control })
    return id
  }, [])

  const updateControl = useCallback(
    (id: string, patch: { date?: string; values?: ControlValues; notes?: string }) => {
      if (!id.startsWith('user-')) return
      const existing = state[id]
      if (!existing) return
      setState({
        ...state,
        [id]: {
          ...existing,
          date: patch.date ?? existing.date,
          values: patch.values ? roundValues(patch.values) : existing.values,
          notes: patch.notes !== undefined ? patch.notes.trim() || undefined : existing.notes,
        },
      })
    },
    [],
  )

  const removeControl = useCallback((id: string) => {
    if (!id.startsWith('user-')) return
    const next = { ...state }
    delete next[id]
    setState(next)
  }, [])

  const getControl = useCallback(
    (id: string): Control | undefined => controls.find((c) => c.id === id),
    [controls],
  )

  const latest = controls.length ? controls[controls.length - 1] : undefined
  const previous = controls.length > 1 ? controls[controls.length - 2] : undefined

  // Último control (opcionalmente anterior a `before`) que tenga dato para esa métrica —
  // clave para deltas cuando hay controles parciales.
  const latestWith = useCallback(
    (metric: MetricKey | DerivedKey, before?: string): { control: Control; value: number } | undefined => {
      const beforeIdx = before ? controls.findIndex((x) => x.id === before) : -1
      for (let i = controls.length - 1; i >= 0; i--) {
        if (beforeIdx >= 0 && i >= beforeIdx) continue
        const v = metricValue(controls[i], metric)
        if (v !== undefined) return { control: controls[i], value: v }
      }
      return undefined
    },
    [controls],
  )

  return { controls, addControl, updateControl, removeControl, getControl, latest, previous, latestWith }
}
