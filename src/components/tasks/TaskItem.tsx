import { Check } from 'lucide-react'
import {
  PERSONAL_AREA_META,
  TASK_KIND_META,
  URGENCY_META,
  type Task,
} from '../../data/schoolTypes'
import { colorOf } from '../../data/palette'
import { useSchoolSetup } from '../../hooks/useSchool'
import { relativeDay, todayIso } from '../../lib/dates'
import { cx } from '../../lib/cx'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onOpen?: (task: Task) => void
  /** Oculta la materia cuando la lista ya está dentro de una clase. */
  hideClass?: boolean
}

/**
 * Tarjeta de pendiente al estilo «My Tasks» de la referencia: fondo pastel según
 * la urgencia, barra de color a la izquierda y botón de completar a la derecha.
 */
export function TaskItem({ task, onToggle, onOpen, hideClass }: TaskItemProps) {
  const { setup } = useSchoolSetup()
  const personal = task.scope === 'personal'
  const area = personal ? (PERSONAL_AREA_META[task.area ?? 'otro'] ?? PERSONAL_AREA_META.otro) : null
  const kind = TASK_KIND_META[task.kind] ?? TASK_KIND_META.tarea
  const urgency = URGENCY_META[task.urgency] ?? URGENCY_META.normal
  const cls = task.classCode ? setup.classes[task.classCode] : undefined
  const clsColor = cls ? colorOf(cls.color) : undefined
  const overdue = !task.done && task.dueDate != null && task.dueDate < todayIso()

  return (
    <div
      className={cx(
        'relative flex items-start gap-3 overflow-hidden rounded-2xl border-l-[3px] p-3 transition-opacity',
        task.done ? 'border-l-transparent bg-surface-2 opacity-60' : urgency.color.soft,
        !task.done && urgency.color.accent,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {area ? (
            <span
              className={cx(
                'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide',
                area.color.text,
              )}
            >
              <area.Icon size={12} strokeWidth={2.4} aria-hidden />
              {area.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide">
              <kind.Icon size={12} strokeWidth={2.4} aria-hidden />
              {kind.label}
            </span>
          )}
          {!hideClass && cls && clsColor && (
            <span className={cx('inline-flex items-center gap-1 text-[11px] font-semibold', clsColor.text)}>
              <span className={cx('h-1.5 w-1.5 rounded-full', clsColor.dot)} />
              {cls.name}
            </span>
          )}
        </div>

        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="mt-0.5 block w-full text-left"
          >
            <span
              className={cx(
                'block text-sm font-bold text-content',
                task.done && 'line-through',
              )}
            >
              {task.title}
            </span>
          </button>
        ) : (
          <p className={cx('mt-0.5 text-sm font-bold text-content', task.done && 'line-through')}>
            {task.title}
          </p>
        )}

        {task.detail && (
          <p className="mt-0.5 line-clamp-2 text-xs text-content-muted">{task.detail}</p>
        )}

        {task.dueDate && (
          <p
            className={cx(
              'mt-1 text-[11px] font-semibold',
              overdue ? 'text-danger' : 'text-content-muted',
            )}
          >
            {overdue ? 'Vencida · ' : ''}
            {relativeDay(task.dueDate)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={task.done}
        aria-label={task.done ? `Marcar ${task.title} como pendiente` : `Marcar ${task.title} como hecha`}
        className={cx(
          'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors',
          task.done
            ? 'border-transparent bg-ok text-on-solid'
            : 'border-line-strong bg-surface/60 text-transparent hover:border-ok hover:text-ok',
        )}
      >
        <Check size={15} strokeWidth={3} aria-hidden />
      </button>
    </div>
  )
}
