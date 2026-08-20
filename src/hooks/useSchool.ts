import { useCallback, useMemo } from 'react'
import type {
  ClassNote,
  PersonalArea,
  PeriodDef,
  SchoolClass,
  SchoolConfig,
  SchoolSetup,
  SchoolTask,
  TaskKind,
  TaskScope,
  Urgency,
} from '../data/schoolTypes'
import { DEFAULT_SETUP } from '../data/schoolTimetable'
import { normalizeSetup } from '../lib/school'
import { createCollection, createSingleton, newId } from '../lib/cloudStore'

/**
 * Ancla del ciclo: el miércoles 19 de agosto de 2026, primer día de clases de verdad
 * de 11º, es el Día 2 (el martes 18 fue el Día 1). Desde ahí el ciclo cuenta solo
 * en días de clase. Ajustable desde la app con «¿No es el día correcto?», que crea
 * un reinicio en vez de tocar el ancla.
 */
const DEFAULT_CONFIG: SchoolConfig = {
  anchorDate: '2026-08-19',
  anchorDay: 2,
  overrides: [],
  noClassDays: [],
}

// --- Formas de fila en Supabase (el cliente no está tipado con el esquema) ----
interface ConfigRow {
  anchor_date: string
  anchor_day: number
  overrides: { date: string; day: number }[] | null
  setup: SchoolSetup | null
  no_class_days: string[] | null
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
  kind: string | null
  done: boolean | null
  scope: string | null
  area: string | null
}

const configStore = createSingleton<SchoolConfig, ConfigRow>({
  key: 'mivida:school-config:v1',
  table: 'school_config',
  fallback: DEFAULT_CONFIG,
  rowToValue: (r) => ({
    anchorDate: r.anchor_date,
    anchorDay: r.anchor_day,
    overrides: r.overrides ?? [],
    setup: r.setup ?? undefined,
    noClassDays: r.no_class_days ?? [],
  }),
  valueToRow: (v, userId) => ({
    user_id: userId,
    anchor_date: v.anchorDate,
    anchor_day: v.anchorDay,
    overrides: v.overrides,
    setup: v.setup ?? null,
    no_class_days: v.noClassDays ?? [],
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

// Las tareas de Colegio viven en la tabla global `tasks` (con `class_code`), de modo
// que Pendientes y el Calendario comparten el mismo origen de datos.
const tasksStore = createCollection<SchoolTask, TaskRow>({
  key: 'mivida:tasks:v1',
  table: 'tasks',
  rowToItem: (r) => ({
    id: r.id,
    scope: r.scope === 'personal' ? 'personal' : 'colegio',
    classCode: r.class_code ?? undefined,
    area: (r.area as PersonalArea | null) ?? undefined,
    title: r.title,
    detail: r.notes ?? undefined,
    dueDate: r.due_date ?? undefined,
    urgency: (r.urgency as Urgency) ?? 'normal',
    // Lo anterior a los tipos de ítem queda como tarea.
    kind: (r.kind as TaskKind) ?? 'tarea',
    done: r.done ?? false,
  }),
  itemToRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    scope: t.scope,
    class_code: t.classCode ?? null,
    area: t.area ?? null,
    title: t.title,
    notes: t.detail ?? null,
    due_date: t.dueDate ?? null,
    urgency: t.urgency,
    kind: t.kind,
    done: t.done,
  }),
})

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

  /** Marca (o desmarca) un día como «sin clase»: el ciclo se congela ese día. */
  const toggleNoClassDay = useCallback((date: string) => {
    configStore.update((prev) => {
      const days = prev.noClassDays ?? []
      return {
        ...prev,
        noClassDays: days.includes(date)
          ? days.filter((d) => d !== date)
          : [...days, date].sort(),
      }
    })
  }, [])

  return { config, setConfig: configStore.set, setCycleDayOn, toggleNoClassDay }
}

/**
 * Materias y horario editables. Mientras el usuario no haya tocado nada se usa la
 * semilla de `schoolTimetable.ts`; en cuanto edita algo, su versión pasa a mandar.
 */
export function useSchoolSetup() {
  const config = configStore.useValue()
  // `normalizeSetup` sube al formato actual lo que se guardó con la forma antigua
  // (un solo juego de horas), para que añadir el miércoles corto no deje a nadie
  // sin horario.
  const setup = useMemo(
    () => (config.setup ? normalizeSetup(config.setup) : DEFAULT_SETUP),
    [config.setup],
  )

  const mutate = useCallback((fn: (prev: SchoolSetup) => SchoolSetup) => {
    configStore.update((prev) => ({
      ...prev,
      setup: fn(prev.setup ? normalizeSetup(prev.setup) : DEFAULT_SETUP),
    }))
  }, [])

  const upsertClass = useCallback(
    (cls: SchoolClass) => {
      mutate((s) => ({ ...s, classes: { ...s.classes, [cls.code]: cls } }))
    },
    [mutate],
  )

  /** Añade una unidad a la materia si no la tenía ya. */
  const addUnit = useCallback(
    (code: string, unit: string) => {
      const clean = unit.trim()
      if (!clean) return
      mutate((s) => {
        const cls = s.classes[code]
        if (!cls) return s
        const units = cls.units ?? []
        if (units.some((u) => u.toLowerCase() === clean.toLowerCase())) return s
        return { ...s, classes: { ...s.classes, [code]: { ...cls, units: [...units, clean] } } }
      })
    },
    [mutate],
  )

  /** Quita una unidad de la materia. Las notas que la usaban conservan su texto. */
  const removeUnit = useCallback(
    (code: string, unit: string) => {
      mutate((s) => {
        const cls = s.classes[code]
        if (!cls) return s
        return {
          ...s,
          classes: {
            ...s.classes,
            [code]: { ...cls, units: (cls.units ?? []).filter((u) => u !== unit) },
          },
        }
      })
    },
    [mutate],
  )

  /** Borra la materia y la quita de todos los periodos donde estuviera. */
  const removeClass = useCallback(
    (code: string) => {
      mutate((s) => {
        const classes = { ...s.classes }
        delete classes[code]
        const timetable: SchoolSetup['timetable'] = {}
        for (const [day, slots] of Object.entries(s.timetable)) {
          timetable[Number(day)] = slots.filter((x) => x.classCode !== code)
        }
        return { ...s, classes, timetable }
      })
    },
    [mutate],
  )

  /** Asigna materia y salón a un periodo de un día del ciclo. Vacío = periodo libre. */
  const setSlot = useCallback(
    (cycleDay: number, period: string, classCode: string, room: string) => {
      mutate((s) => {
        const slots = (s.timetable[cycleDay] ?? []).filter((x) => x.period !== period)
        if (classCode) slots.push({ period, classCode, room })
        // Mantiene el orden de los periodos del día normal, que es el que define
        // la secuencia Adv → P1 … P6 en todos los tipos de día.
        const order = (s.periodSets.normal ?? []).map((p) => p.period)
        slots.sort((a, b) => order.indexOf(a.period) - order.indexOf(b.period))
        return { ...s, timetable: { ...s.timetable, [cycleDay]: slots } }
      })
    },
    [mutate],
  )

  /** Cambia las horas de un tipo de día ('normal', 'miercoles', …). */
  const setPeriods = useCallback(
    (dayType: string, periods: PeriodDef[]) =>
      mutate((s) => ({ ...s, periodSets: { ...s.periodSets, [dayType]: periods } })),
    [mutate],
  )

  /** Asigna a un día de la semana el juego de horas que le toca. */
  const setDayType = useCallback(
    (weekday: number, dayType: string) =>
      mutate((s) => {
        const next = [...s.dayTypeByWeekday]
        next[weekday] = dayType
        return { ...s, dayTypeByWeekday: next }
      }),
    [mutate],
  )

  /** Vuelve al horario original de Grade 11. */
  const resetSetup = useCallback(() => {
    configStore.update((prev) => ({ ...prev, setup: undefined }))
  }, [])

  const isCustom = config.setup != null

  return {
    setup,
    upsertClass,
    removeClass,
    setSlot,
    setPeriods,
    setDayType,
    addUnit,
    removeUnit,
    resetSetup,
    isCustom,
  }
}

export function useClassNotes(classCode?: string) {
  const all = notesStore.useAll()
  const notes = useMemo(
    () => (classCode ? all.filter((n) => n.classCode === classCode) : all),
    [all, classCode],
  )

  const addNote = useCallback((note: Omit<ClassNote, 'id'>) => {
    const created = { ...note, id: newId() }
    notesStore.upsert(created)
    return created
  }, [])

  const updateNote = useCallback((note: ClassNote) => {
    notesStore.upsert(note)
  }, [])

  const removeNote = useCallback((id: string) => {
    notesStore.remove(id)
  }, [])

  return { notes, addNote, updateNote, removeNote }
}

/** Una nota concreta por id, para abrirla a página completa. */
export function useClassNote(id?: string) {
  const all = notesStore.useAll()
  return useMemo(() => (id ? all.find((n) => n.id === id) : undefined), [all, id])
}

export function useTasks(classCode?: string) {
  const all = tasksStore.useAll()
  const tasks = useMemo(
    () => (classCode ? all.filter((t) => t.classCode === classCode) : all),
    [all, classCode],
  )

  const addTask = useCallback(
    (
      task: Omit<SchoolTask, 'id' | 'done' | 'kind' | 'scope'> & {
        kind?: TaskKind
        scope?: TaskScope
      },
    ) => {
      tasksStore.upsert({
        ...task,
        scope: task.scope ?? (task.classCode ? 'colegio' : 'personal'),
        kind: task.kind ?? 'tarea',
        id: newId(),
        done: false,
      })
    },
    [],
  )

  const updateTask = useCallback((task: SchoolTask) => {
    tasksStore.upsert(task)
  }, [])

  const toggleTask = useCallback((id: string) => {
    const t = tasksStore.get().find((x) => x.id === id)
    if (t) tasksStore.upsert({ ...t, done: !t.done })
  }, [])

  const removeTask = useCallback((id: string) => {
    tasksStore.remove(id)
  }, [])

  return { tasks, addTask, updateTask, toggleTask, removeTask }
}
