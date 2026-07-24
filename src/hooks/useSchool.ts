import { useCallback } from 'react'
import type { ClassNote, SchoolConfig, SchoolTask, Urgency } from '../data/schoolTypes'
import { createCollection, createSingleton } from '../lib/cloudStore'

// Ancla por defecto (configurable en la app): hoy = Día 1 hasta que Juan Diego lo ajuste
// con "hoy es el Día N" (que crea un reinicio del ciclo).
const DEFAULT_CONFIG: SchoolConfig = {
  anchorDate: '2026-07-23',
  anchorDay: 1,
  overrides: [],
}

// --- Formas de fila en Supabase (el cliente no está tipado con el esquema) ----
interface ConfigRow {
  anchor_date: string
  anchor_day: number
  overrides: { date: string; day: number }[] | null
}
interface NoteRow {
  id: string
  class_code: string
  date: string
  unit: string | null
  title: string | null
  notebook_page: string | null
  body: string | null
  important: boolean | null
}
interface TaskRow {
  id: string
  class_code: string | null
  title: string
  notes: string | null
  due_date: string | null
  urgency: string | null
  done: boolean | null
}

const configStore = createSingleton<SchoolConfig, ConfigRow>({
  key: 'mivida:school-config:v1',
  table: 'school_config',
  fallback: DEFAULT_CONFIG,
  rowToValue: (r) => ({
    anchorDate: r.anchor_date,
    anchorDay: r.anchor_day,
    overrides: r.overrides ?? [],
  }),
  valueToRow: (v, userId) => ({
    user_id: userId,
    anchor_date: v.anchorDate,
    anchor_day: v.anchorDay,
    overrides: v.overrides,
    updated_at: new Date().toISOString(),
  }),
})

const notesStore = createCollection<ClassNote, NoteRow>({
  key: 'mivida:class-notes:v1',
  table: 'class_notes',
  rowToItem: (r) => ({
    id: r.id,
    classCode: r.class_code,
    date: r.date,
    unit: r.unit ?? '',
    title: r.title ?? '',
    notebookPage: r.notebook_page ?? '',
    body: r.body ?? '',
    important: r.important ?? false,
  }),
  itemToRow: (n, userId) => ({
    id: n.id,
    user_id: userId,
    class_code: n.classCode,
    date: n.date,
    unit: n.unit,
    title: n.title,
    notebook_page: n.notebookPage,
    body: n.body,
    important: n.important,
    updated_at: new Date().toISOString(),
  }),
})

// Las tareas de Colegio viven en la tabla global `tasks` (con `class_code`), lista para
// que el módulo de Pendientes de la Fase 3 comparta el mismo origen de datos.
const tasksStore = createCollection<SchoolTask, TaskRow>({
  key: 'mivida:tasks:v1',
  table: 'tasks',
  rowToItem: (r) => ({
    id: r.id,
    classCode: r.class_code ?? undefined,
    title: r.title,
    detail: r.notes ?? undefined,
    dueDate: r.due_date ?? undefined,
    urgency: (r.urgency as Urgency) ?? 'normal',
    done: r.done ?? false,
  }),
  itemToRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    class_code: t.classCode ?? null,
    title: t.title,
    notes: t.detail ?? null,
    due_date: t.dueDate ?? null,
    urgency: t.urgency,
    done: t.done,
    updated_at: new Date().toISOString(),
  }),
})

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)
}

export function useSchoolConfig() {
  const config = configStore.useValue()

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
  const all = notesStore.useAll()
  const notes = classCode ? all.filter((n) => n.classCode === classCode) : all

  const addNote = useCallback((note: Omit<ClassNote, 'id'>) => {
    notesStore.upsert({ ...note, id: uid() })
  }, [])

  const removeNote = useCallback((id: string) => {
    notesStore.remove(id)
  }, [])

  return { notes, addNote, removeNote }
}

export function useTasks(classCode?: string) {
  const all = tasksStore.useAll()
  const tasks = classCode ? all.filter((t) => t.classCode === classCode) : all

  const addTask = useCallback((task: Omit<SchoolTask, 'id' | 'done'>) => {
    tasksStore.upsert({ ...task, id: uid(), done: false })
  }, [])

  const toggleTask = useCallback((id: string) => {
    const t = tasksStore.get().find((x) => x.id === id)
    if (t) tasksStore.upsert({ ...t, done: !t.done })
  }, [])

  const removeTask = useCallback((id: string) => {
    tasksStore.remove(id)
  }, [])

  return { tasks, addTask, toggleTask, removeTask }
}
