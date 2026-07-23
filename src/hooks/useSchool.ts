import { useCallback } from 'react'
import { createLocalStore } from '../lib/localStore'
import type { ClassNote, SchoolConfig, SchoolTask } from '../data/schoolTypes'

// Valores por defecto: ancla configurable en la app. Hoy = Día 1 hasta que Juan Diego
// lo ajuste con "Hoy es Día N" (que crea un reinicio del ciclo).
const DEFAULT_CONFIG: SchoolConfig = {
  anchorDate: '2026-07-23',
  anchorDay: 1,
  overrides: [],
}

const configStore = createLocalStore<SchoolConfig>('mivida:school-config:v1', DEFAULT_CONFIG)
const notesStore = createLocalStore<ClassNote[]>('mivida:class-notes:v1', [])
const tasksStore = createLocalStore<SchoolTask[]>('mivida:tasks:v1', [])

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useSchoolConfig() {
  const config = configStore.useStore()

  /** Reinicia el ciclo: a partir de `date`, el día pasa a ser `day`. */
  const setCycleDayOn = useCallback((date: string, day: number) => {
    configStore.update((prev) => {
      const overrides = prev.overrides.filter((o) => o.date !== date)
      overrides.push({ date, day })
      overrides.sort((a, b) => a.date.localeCompare(b.date))
      return { ...prev, overrides }
    })
  }, [])

  return { config, setConfig: configStore.set, setCycleDayOn }
}

export function useClassNotes(classCode?: string) {
  const all = notesStore.useStore()
  const notes = classCode ? all.filter((n) => n.classCode === classCode) : all

  const addNote = useCallback((note: Omit<ClassNote, 'id'>) => {
    notesStore.update((prev) => [...prev, { ...note, id: uid() }])
  }, [])

  const removeNote = useCallback((id: string) => {
    notesStore.update((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notes, addNote, removeNote }
}

export function useTasks(classCode?: string) {
  const all = tasksStore.useStore()
  const tasks = classCode ? all.filter((t) => t.classCode === classCode) : all

  const addTask = useCallback((task: Omit<SchoolTask, 'id' | 'done'>) => {
    tasksStore.update((prev) => [...prev, { ...task, id: uid(), done: false }])
  }, [])

  const toggleTask = useCallback((id: string) => {
    tasksStore.update((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const removeTask = useCallback((id: string) => {
    tasksStore.update((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { tasks, addTask, toggleTask, removeTask }
}
