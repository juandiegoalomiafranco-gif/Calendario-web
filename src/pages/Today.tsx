import { Link } from 'react-router-dom'
import {
  CalendarDays,
  GraduationCap,
  ListChecks,
  PartyPopper,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { holidayName } from '../data/holidays'
import { PageHeader } from '../components/layout/PageHeader'
import { SchoolTodayCard } from '../components/panels/SchoolTodayCard'
import { FinanceCard } from '../components/panels/FinanceCard'
import { ImportantEventsCard } from '../components/panels/ImportantEventsCard'
import { UrgentTasksCard } from '../components/panels/UrgentTasksCard'
import { useSchoolSetup, useTasks } from '../hooks/useSchool'
import { useNextSchoolDay, useNowAndNext } from '../hooks/useSchoolDay'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { formatDayMonth, formatFull, relativeDay, todayIso, weekdayLong } from '../lib/dates'
import { cx } from '../lib/cx'

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

interface KpiProps {
  Icon: LucideIcon
  label: string
  value: string
  caption: string
  tone: string
  to: string
}

/** Indicador compacto de la fila superior. */
function Kpi({ Icon, label, value, caption, tone, to }: KpiProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lg"
    >
      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', tone)}>
        <Icon size={19} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-content-muted">{label}</span>
        <span className="line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-content">
          {value}
        </span>
        <span className="line-clamp-2 text-[11px] leading-snug text-content-subtle">{caption}</span>
      </span>
    </Link>
  )
}

export function Today() {
  const iso = todayIso()
  const holiday = holidayName(iso)
  const { tasks } = useTasks()
  const { setup } = useSchoolSetup()
  const { events } = useCalendarEvents()
  const { current, next, cycle } = useNowAndNext(iso, true)
  const nextDay = useNextSchoolDay(iso)

  const openTasks = tasks.filter((t) => !t.done).length
  const dueToday = tasks.filter((t) => !t.done && t.dueDate === iso).length
  // El examen más cercano que aún no ha pasado: es lo primero que hay que preparar.
  const nextExam = tasks
    .filter((t) => !t.done && t.kind === 'examen' && t.dueDate && t.dueDate >= iso)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0]
  const nextEvent = events
    .filter((e) => e.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={formatFull(iso)}
        title="Inicio"
        actions={
          <Link
            to="/pendientes"
            className="hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-content-subtle transition-colors hover:text-content lg:inline-flex"
          >
            <Search size={16} aria-hidden />
            Buscar tarea, clase o evento…
          </Link>
        }
      >
        {holiday && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <PartyPopper size={13} aria-hidden />
            Festivo · {holiday}
          </span>
        )}
      </PageHeader>

      {/* Fila de indicadores */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          Icon={CalendarDays}
          label="Colegio"
          value={cycle.cycleDay ? `Día ${cycle.cycleDay}` : 'Descanso'}
          caption={
            current
              ? `Ahora: ${current.cls.name}`
              : next
                ? `Sigue: ${next.cls.name}`
                : nextDay
                  ? // Sin más clases hoy, lo útil es saber qué día toca después.
                    `${mayuscula(relativeDay(nextDay.date, iso) === 'mañana' ? 'mañana' : weekdayLong(nextDay.date))}: Día ${nextDay.cycleDay}`
                  : holiday
                    ? 'Festivo'
                    : 'Sin clases a la vista'
          }
          tone="bg-cat-soft-blue text-cat-blue"
          to="/colegio"
        />
        <Kpi
          Icon={ListChecks}
          label="Pendientes"
          value={String(openTasks)}
          caption={dueToday > 0 ? `${dueToday} vencen hoy` : 'sin vencimientos hoy'}
          tone="bg-cat-soft-rose text-cat-rose"
          to="/pendientes"
        />
        <Kpi
          Icon={GraduationCap}
          label="Próximo examen"
          value={
            nextExam
              ? (setup.classes[nextExam.classCode ?? '']?.name ?? nextExam.title)
              : 'Ninguno'
          }
          caption={
            nextExam?.dueDate
              ? `${relativeDay(nextExam.dueDate, iso)} · ${nextExam.title}`
              : 'sin exámenes programados'
          }
          tone="bg-cat-soft-orange text-cat-orange"
          to="/pendientes"
        />
        <Kpi
          Icon={Sparkles}
          label="Próximo evento"
          value={nextEvent ? nextEvent.title : 'Ninguno'}
          caption={nextEvent ? formatDayMonth(nextEvent.date) : 'añade uno en el calendario'}
          tone="bg-cat-soft-violet text-cat-violet"
          to="/calendario"
        />
      </div>

      {/* Bento: lo grande a la izquierda, lo que se consulta rápido a la derecha */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-6 lg:gap-5">
        <SchoolTodayCard className="lg:col-span-4 lg:row-span-2" />
        <UrgentTasksCard className="lg:col-span-2" limit={4} title="Pendientes" />
        <ImportantEventsCard className="lg:col-span-2" limit={3} />
        <FinanceCard className="lg:col-span-2" />
      </div>
    </div>
  )
}
