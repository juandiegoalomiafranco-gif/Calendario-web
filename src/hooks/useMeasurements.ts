import { useCallback, useMemo, useRef, useState } from 'react'
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

// Escritura síncrona fuera del updater de React: el wizard guarda y navega en
// el mismo handler, se desmonta en ese mismo lote y React descarta sus updaters
// pendientes — un useEffect (o un persist dentro del updater) nunca correría.
function persist(map: ControlMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // sin espacio o storage bloqueado: la app sigue funcionando en memoria
  }
}

export function useMeasurements() {
  const [userControls, setUserControls] = useState<ControlMap>(() => readStorage())
  const mapRef = useRef(userControls)
  mapRef.current = userControls

  const commit = useCallback((next: ControlMap) => {
    persist(next)
    mapRef.current = next
    setUserControls(next)
  }, [])

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
    commit({ ...mapRef.current, [id]: control })
    return id
  }, [commit])

  const updateControl = useCallback(
    (id: string, patch: { date?: string; values?: ControlValues; notes?: string }) => {
      if (!id.startsWith('user-')) return
      const existing = mapRef.current[id]
      if (!existing) return
      commit({
        ...mapRef.current,
        [id]: {
          ...existing,
          date: patch.date ?? existing.date,
          values: patch.values ? roundValues(patch.values) : existing.values,
          notes: patch.notes !== undefined ? patch.notes.trim() || undefined : existing.notes,
        },
      })
    },
    [commit],
  )

  const removeControl = useCallback((id: string) => {
    if (!id.startsWith('user-')) return
    const next = { ...mapRef.current }
    delete next[id]
    commit(next)
  }, [commit])

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
      for (let i = controls.length - 1; i >= 0; i--) {
        const c = controls[i]
        if (before && c.id === before) continue
        if (before) {
          const beforeIdx = controls.findIndex((x) => x.id === before)
          if (beforeIdx >= 0 && i >= beforeIdx) continue
        }
        const v = metricValue(c, metric)
        if (v !== undefined) return { control: c, value: v }
      }
      return undefined
    },
    [controls],
  )

  return { controls, addControl, updateControl, removeControl, getControl, latest, previous, latestWith }
}
