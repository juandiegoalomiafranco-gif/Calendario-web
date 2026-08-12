import { Link } from 'react-router-dom'
import { ArrowUpRight, PartyPopper } from 'lucide-react'
import { useTasks } from '../../hooks/useSchool'
import { todayIso } from '../../lib/dates'
import { URGENCY_ORDER, type SchoolTask } from '../../data/schoolTypes'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'
import { TaskItem } from '../tasks/TaskItem'

/**
 * Pendientes ordenados por lo que aprieta: primero lo vencido, luego por fecha de
 * entrega y, a igualdad, por urgencia. Sirve para el panel lateral y para Inicio.
 */
export function sortByPressure(tasks: SchoolTask[], today = todayIso()): SchoolTask[] {
  return [...tasks].sort((a, b) => {
    const overdueA = a.dueDate != null && a.dueDate < today ? 0 : 1
    const overdueB = b.dueDate != null && b.dueDate < today ? 0 : 1
    if (overdueA !== overdueB) return overdueA - overdueB
    const dueA = a.dueDate ?? '9999-12-31'
    const dueB = b.dueDate ?? '9999-12-31'
    if (dueA !== dueB) return dueA.localeCompare(dueB)
    return URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency)
  })
}

interface UrgentTasksCardProps {
  limit?: number
  className?: string
  title?: string
}

/** «Pendientes urgentes»: lo que vence más pronto, listo para marcar. */
export function UrgentTasksCard({
  limit = 4,
  className,
  title = 'Pendientes urgentes',
}: UrgentTasksCardProps) {
  const { tasks, toggleTask } = useTasks()
  const pending = sortByPressure(tasks.filter((t) => !t.done)).slice(0, limit)

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title={title}
        action={
          <Link
            to="/pendientes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
          >
            Ver todos
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        }
      />

      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-2 py-6 text-center">
          <PartyPopper size={20} className="text-content-subtle" aria-hidden />
          <p className="text-sm text-content-muted">No tienes nada pendiente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={toggleTask} />
          ))}
        </div>
      )}
    </Card>
  )
}
