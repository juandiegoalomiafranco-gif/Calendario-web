import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, ClipboardCheck, FileText, GraduationCap, Plus, Star } from 'lucide-react'
import { TASK_KIND_META, type TaskKind } from '../../data/schoolTypes'
import { useTasks } from '../../hooks/useSchool'
import { useSchoolDay } from '../../hooks/useSchoolDay'
import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import { formatFull, nowMinutes, todayIso } from '../../lib/dates'
import type { ResolvedSlot } from '../../lib/school'
import { cx } from '../../lib/cx'
import { AddItemSheet } from '../school/AddItemSheet'
import { Sheet } from '../ui/Sheet'

/**
 * La línea de tiempo de un día, minuto a minuto: horas a la izquierda, cada clase con
 * su barra de color, el recreo y el almuerzo como separadores y la clase en curso
 * marcada «Ahora». Lo que vence ese día va pegado a su clase.
 *
 * Tocar una clase abre su menú: añadirle una tarea, un examen, un quiz o una entrega
 * con esa materia y esa fecha ya puestas, o ir a sus pendientes y notas.
 */
export function DaySchedule({ date, compact = false }: { date: string; compact?: boolean }) {
  const { slots, cycle } = useSchoolDay(date)
  const { tasks } = useTasks()
  const { events } = useCalendarEvents()
  const [menu, setMenu] = useState<ResolvedSlot | null>(null)
  const esHoy = date === todayIso()
  const ahora = nowMinutes()

  const tareasPorMateria = useMemo(() => {
    const m = new Map<string, typeof tasks>()
    for (const t of tasks) {
      if (t.done || t.dueDate !== date || !t.classCode) continue
      m.set(t.classCode, [...(m.get(t.classCode) ?? []), t])
    }
    return m
  }, [tasks, date])

  const eventosDelDia = events.filter((e) => e.date === date)

  return (
    <div className="flex flex-col gap-2.5">
      {eventosDelDia.map((e) => (
        <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-cat-soft-violet px-3.5 py-2.5 text-cat-violet">
          <Star size={17} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-micro uppercase">{e.time ? e.time : 'Todo el día'}</span>
            <span className="block truncate text-body font-semibold text-content">{e.title}</span>
          </span>
        </div>
      ))}

      {!cycle.schoolDay && (
        <p className="rounded-2xl bg-surface-2 p-4 text-body text-content-muted">
          {cycle.reason ?? 'Sin colegio'}: este día no hay clases.
        </p>
      )}

      {slots.map((slot) => {
        if (slot.kind === 'break') {
          return (
            <div key={slot.period} className="flex min-h-8 items-center gap-3">
              <span className={cx('shrink-0 text-right text-caption text-content-muted', compact ? 'w-11' : 'w-[92px]')}>
                {slot.start}
              </span>
              <span className="h-px flex-1 bg-line" />
              <span className="text-caption text-content-muted">
                {slot.period} · {slot.endMin - slot.startMin} min
              </span>
              <span className="h-px w-6 bg-line" />
            </div>
          )
        }
        if (!slot.classCode) return null
        const vivo = esHoy && ahora >= slot.startMin && ahora < slot.endMin
        const pendientes = tareasPorMateria.get(slot.classCode) ?? []
        return (
          <div key={slot.period} className={cx('flex gap-3', compact ? 'items-stretch' : 'items-center')}>
            <span className={cx('shrink-0 text-right', compact ? 'w-11 pt-3' : 'w-[92px]')}>
              <span className="block text-caption font-semibold text-content lg:inline">{slot.start}</span>
              <span className="block text-xs text-content-muted lg:inline">
                <span className="hidden lg:inline"> – </span>
                {slot.end}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setMenu(slot)}
              aria-label={`${slot.cls.name}, ${slot.start} a ${slot.end}. Añadir tarea o ver notas`}
              className={cx(
                'flex min-w-0 flex-1 gap-3 rounded-[18px] border bg-surface px-3.5 py-3 text-left transition-colors hover:bg-surface-2',
                vivo ? 'border-content bg-brand-soft' : 'border-line',
                compact ? 'items-start' : 'items-center',
              )}
            >
              <span className={cx('w-1 shrink-0 self-stretch rounded-full', slot.color.dot)} />
              <span className={cx('min-w-0 flex-1', !compact && 'lg:flex lg:items-center lg:gap-3')}>
                <span className="flex items-center gap-2">
                  <span className="truncate text-body font-semibold text-content">{slot.cls.name}</span>
                  {vivo && (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-on">
                      Ahora
                    </span>
                  )}
                </span>
                <span className="block truncate text-caption text-content-muted">
                  {[slot.period, slot.room, slot.cls.teacher].filter(Boolean).join(' · ')}
                </span>
                {pendientes.map((t) => (
                  <span
                    key={t.id}
                    className="mt-1.5 flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-1.5 lg:mt-0"
                  >
                    <span className="text-xs font-bold text-danger">
                      {(TASK_KIND_META[t.kind] ?? TASK_KIND_META.tarea).label}
                    </span>
                    <span className="truncate text-caption font-semibold text-content">{t.title}</span>
                  </span>
                ))}
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center self-center rounded-full bg-surface-2 text-content">
                <Plus size={14} strokeWidth={2.4} aria-hidden />
              </span>
            </button>
          </div>
        )
      })}

      <ClassMenuSheet slot={menu} date={date} onClose={() => setMenu(null)} />
    </div>
  )
}

const ACCIONES: { kind: TaskKind; Icon: typeof ClipboardCheck; tone: string }[] = [
  { kind: 'tarea', Icon: ClipboardCheck, tone: 'bg-cat-soft-blue text-cat-blue' },
  { kind: 'examen', Icon: GraduationCap, tone: 'bg-cat-soft-rose text-cat-rose' },
  { kind: 'quiz', Icon: FileText, tone: 'bg-cat-soft-violet text-cat-violet' },
  { kind: 'entrega', Icon: BookOpen, tone: 'bg-cat-soft-teal text-cat-teal' },
]

/** El menú de una clase: añadirle algo para ese día o ir a sus pendientes y notas. */
function ClassMenuSheet({
  slot,
  date,
  onClose,
}: {
  slot: ResolvedSlot | null
  date: string
  onClose: () => void
}) {
  const { tasks } = useTasks()
  const [adding, setAdding] = useState<{ code: string; kind: TaskKind } | null>(null)
  const abiertos = slot ? tasks.filter((t) => !t.done && t.classCode === slot.classCode).length : 0

  return (
    <>
      <Sheet
        open={slot != null}
        onClose={onClose}
        title={slot?.cls.name ?? ''}
        subtitle={
          slot
            ? `${[slot.period, `${slot.start}–${slot.end}`, slot.room].filter(Boolean).join(' · ')} · ${formatFull(date)}`
            : undefined
        }
      >
        {slot && (
          <div className="flex flex-col gap-4">
            <p className="text-micro uppercase text-content-muted">Añadir para esta clase</p>
            <div className="-mt-2 grid grid-cols-2 gap-2.5">
              {ACCIONES.map(({ kind, Icon, tone }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setAdding({ code: slot.classCode, kind })
                    onClose()
                  }}
                  className={cx('flex min-h-16 items-center gap-2.5 rounded-[18px] px-3.5 text-body font-semibold', tone)}
                >
                  <Icon size={20} aria-hidden />
                  {TASK_KIND_META[kind].label}
                </button>
              ))}
            </div>
            <p className="-mt-1.5 text-caption text-content-muted">
              Queda guardado para {slot.cls.name} con fecha del {formatFull(date)}.
            </p>
            <div className="overflow-hidden rounded-[18px] border border-line">
              <Link
                to="/pendientes"
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 px-4 text-body font-semibold text-content hover:bg-surface-2"
              >
                <span className="flex-1">Pendientes de {slot.cls.name}</span>
                <span className="text-caption text-content-muted">
                  {abiertos === 1 ? '1 abierto' : `${abiertos} abiertos`}
                </span>
                <ChevronRight size={16} aria-hidden />
              </Link>
              <div className="h-px bg-line" />
              <Link
                to={`/colegio/clase/${encodeURIComponent(slot.classCode)}`}
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 px-4 text-body font-semibold text-content hover:bg-surface-2"
              >
                <span className="flex-1">Notas de clase</span>
                <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </Sheet>

      <AddItemSheet
        open={adding != null}
        onClose={() => setAdding(null)}
        classCode={adding?.code}
        date={date}
        initialKind={adding?.kind ?? 'tarea'}
      />
    </>
  )
}

/** El horario del día en un panel que sube desde abajo (celular). */
export function DayScheduleSheet({
  open,
  onClose,
  date,
  titulo,
  subtitulo,
}: {
  open: boolean
  onClose: () => void
  date: string
  titulo: string
  subtitulo?: string
}) {
  return (
    <Sheet open={open} onClose={onClose} title={titulo} subtitle={subtitulo}>
      <p className="-mt-1 mb-3 text-caption text-content-muted">
        Toca una clase para añadirle una tarea, un examen o ver sus notas.
      </p>
      <DaySchedule date={date} compact />
    </Sheet>
  )
}
