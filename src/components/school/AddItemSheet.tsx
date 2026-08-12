import { useEffect, useState } from 'react'
import {
  TASK_KIND_META,
  TASK_KIND_ORDER,
  URGENCY_META,
  URGENCY_ORDER,
  type TaskKind,
  type Urgency,
} from '../../data/schoolTypes'
import { useSchoolSetup, useTasks } from '../../hooks/useSchool'
import { formatFull } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Button } from '../ui/Button'
import { DateInput, Field, TextArea, TextInput } from '../ui/Field'
import { Sheet } from '../ui/Sheet'

interface AddItemSheetProps {
  open: boolean
  onClose: () => void
  /** Materia a la que se asocia; si falta, el ítem queda como general. */
  classCode?: string
  /** Fecha propuesta (la de esa clase). */
  date?: string
  /** Tipo con el que abre el formulario. */
  initialKind?: TaskKind
}

/**
 * Formulario para programar algo en una clase: tarea, examen, quiz o entrega.
 * Lo que se guarda aquí aparece automáticamente en Pendientes y, por su fecha de
 * entrega, en el Calendario.
 */
export function AddItemSheet({
  open,
  onClose,
  classCode,
  date,
  initialKind = 'tarea',
}: AddItemSheetProps) {
  const { addTask } = useTasks()
  const { setup } = useSchoolSetup()
  const cls = classCode ? setup.classes[classCode] : undefined

  const [kind, setKind] = useState<TaskKind>(initialKind)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [dueDate, setDueDate] = useState(date ?? '')
  const [urgency, setUrgency] = useState<Urgency>('normal')

  // Al abrir para otra clase u otro día, el formulario arranca limpio.
  useEffect(() => {
    if (!open) return
    setKind(initialKind)
    setTitle('')
    setDetail('')
    setDueDate(date ?? '')
    setUrgency(initialKind === 'examen' ? 'urgente' : 'normal')
  }, [open, date, initialKind])

  function save() {
    const clean = title.trim()
    if (!clean) return
    addTask({
      title: clean,
      detail: detail.trim() || undefined,
      dueDate: dueDate || undefined,
      urgency,
      kind,
      classCode,
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={cls ? `Añadir a ${cls.name}` : 'Añadir pendiente'}
      subtitle={date ? formatFull(date) : undefined}
      footer={
        <Button variant="primary" size="lg" className="w-full justify-center" onClick={save}>
          Guardar
        </Button>
      }
    >
      <Field label="¿Qué es?">
        <div className="grid grid-cols-4 gap-1.5">
          {TASK_KIND_ORDER.map((k) => {
            const meta = TASK_KIND_META[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={cx(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition-colors',
                  kind === k ? meta.color.solid : 'bg-surface-2 text-content-muted hover:text-content',
                )}
              >
                <meta.Icon size={17} aria-hidden />
                {meta.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Título">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'examen' ? 'Examen de la unidad 3' : 'Terminar el taller'}
          autoFocus
        />
      </Field>

      <Field label="Detalle (opcional)">
        <TextArea
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Temas, páginas, qué hay que llevar…"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha" hint="Con fecha aparece en el calendario.">
          <DateInput value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label="Urgencia">
          <div className="flex flex-col gap-1.5">
            {URGENCY_ORDER.map((u) => {
              const meta = URGENCY_META[u]
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  aria-pressed={urgency === u}
                  className={cx(
                    'flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-colors',
                    urgency === u ? meta.color.solid : 'bg-surface-2 text-content-muted',
                  )}
                >
                  <span
                    className={cx(
                      'h-2 w-2 rounded-full',
                      urgency === u ? 'bg-white' : meta.color.dot,
                    )}
                  />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </Sheet>
  )
}
