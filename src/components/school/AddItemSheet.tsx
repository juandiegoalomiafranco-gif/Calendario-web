import { useEffect, useState } from 'react'
import { GraduationCap, House } from 'lucide-react'
import {
  PERSONAL_AREA_META,
  PERSONAL_AREA_ORDER,
  TASK_KIND_META,
  TASK_KIND_ORDER,
  URGENCY_META,
  URGENCY_ORDER,
  type PersonalArea,
  type TaskKind,
  type TaskScope,
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
  /** Con qué pestaña abre: colegio o personal. */
  initialScope?: TaskScope
  /** Oculta el selector colegio/personal (cuando ya se sabe de dónde viene). */
  lockScope?: boolean
}

/**
 * Formulario para programar algo: una tarea, examen, quiz o entrega de una clase,
 * o un pendiente personal de la casa. Lo que se guarda aquí aparece solo en
 * Pendientes, en Inicio y —si tiene fecha— en el Calendario, porque los dos tipos
 * comparten la misma tabla.
 */
export function AddItemSheet({
  open,
  onClose,
  classCode,
  date,
  initialKind = 'tarea',
  initialScope,
  lockScope = false,
}: AddItemSheetProps) {
  const { addTask } = useTasks()
  const { setup } = useSchoolSetup()
  const cls = classCode ? setup.classes[classCode] : undefined

  const defaultScope: TaskScope = initialScope ?? (classCode ? 'colegio' : 'personal')
  const [scope, setScope] = useState<TaskScope>(defaultScope)
  const [kind, setKind] = useState<TaskKind>(initialKind)
  const [area, setArea] = useState<PersonalArea>('casa')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [dueDate, setDueDate] = useState(date ?? '')
  const [urgency, setUrgency] = useState<Urgency>('normal')

  // Al abrir para otra clase u otro día, el formulario arranca limpio.
  useEffect(() => {
    if (!open) return
    setScope(defaultScope)
    setKind(initialKind)
    setArea('casa')
    setTitle('')
    setDetail('')
    setDueDate(date ?? '')
    setUrgency(initialKind === 'examen' ? 'urgente' : 'normal')
  }, [open, date, initialKind, defaultScope])

  function save() {
    const clean = title.trim()
    if (!clean) return
    addTask({
      scope,
      title: clean,
      detail: detail.trim() || undefined,
      dueDate: dueDate || undefined,
      urgency,
      kind: scope === 'colegio' ? kind : 'tarea',
      classCode: scope === 'colegio' ? classCode : undefined,
      area: scope === 'personal' ? area : undefined,
    })
    onClose()
  }

  const titulo = cls
    ? `Añadir a ${cls.name}`
    : scope === 'personal'
      ? 'Nuevo pendiente personal'
      : 'Añadir pendiente'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle={date ? formatFull(date) : undefined}
      footer={
        <Button variant="primary" size="lg" className="w-full justify-center" onClick={save}>
          Guardar
        </Button>
      }
    >
      {!lockScope && !classCode && (
        <Field label="¿De qué es?">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { value: 'colegio' as const, label: 'Colegio', Icon: GraduationCap },
                { value: 'personal' as const, label: 'Personal', Icon: House },
              ]
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                aria-pressed={scope === value}
                className={cx(
                  'flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-colors',
                  scope === value
                    ? 'bg-primary text-primary-on'
                    : 'bg-surface-2 text-content-muted hover:text-content',
                )}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {scope === 'colegio' ? (
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
      ) : (
        <Field label="¿De qué área?">
          <div className="grid grid-cols-4 gap-1.5">
            {PERSONAL_AREA_ORDER.map((a) => {
              const meta = PERSONAL_AREA_META[a]
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  aria-pressed={area === a}
                  className={cx(
                    'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition-colors',
                    area === a ? meta.color.solid : 'bg-surface-2 text-content-muted hover:text-content',
                  )}
                >
                  <meta.Icon size={17} aria-hidden />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </Field>
      )}

      <Field label="Título">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            scope === 'personal'
              ? 'Sacar la ropa de la lavadora'
              : kind === 'examen'
                ? 'Examen de la unidad 3'
                : 'Terminar el taller'
          }
          autoFocus
        />
      </Field>

      <Field label="Detalle (opcional)">
        <TextArea
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={
            scope === 'personal'
              ? 'Lo que haya que tener en cuenta…'
              : 'Temas, páginas, qué hay que llevar…'
          }
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha" hint="Con fecha aparece en el calendario.">
          <DateInput value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label="Importancia">
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
                      urgency === u ? 'bg-on-solid' : meta.color.dot,
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
