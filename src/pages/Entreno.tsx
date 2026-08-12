import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  MapPin,
  NotebookPen,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { PLAN, getDayPlan, todayISO, GOAL_DISTANCE_KM } from '../data/plan'
import { SessionCard } from '../components/SessionCard'
import { StatCard } from '../components/StatCard'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { computeStreaks, kmForEntry } from '../lib/stats'
import { formatFull } from '../lib/dates'

interface Access {
  to: string
  Icon: LucideIcon
  label: string
  caption: string
  tone: string
}

const LINKS: Access[] = [
  {
    to: '/semana',
    Icon: CalendarDays,
    label: 'Plan de la semana',
    caption: 'Ver el calendario completo',
    tone: 'bg-cat-soft-blue text-cat-blue',
  },
  {
    to: '/progreso',
    Icon: TrendingUp,
    label: 'Estadísticas',
    caption: 'Km, ritmo, FC y cumplimiento',
    tone: 'bg-cat-soft-green text-cat-green',
  },
  {
    to: '/entreno/fuerza',
    Icon: Dumbbell,
    label: 'Levantamientos',
    caption: 'Series, reps, peso y PR',
    tone: 'bg-cat-soft-violet text-cat-violet',
  },
  {
    to: '/entreno/notas',
    Icon: NotebookPen,
    label: 'Notas de gym',
    caption: 'Molestias, lesiones, recordatorios',
    tone: 'bg-cat-soft-amber text-cat-amber',
  },
]

/** Acceso a una subsección de entreno. */
function AccessCard({ to, Icon, label, caption, tone }: Access) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lg"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon size={19} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-content">{label}</span>
        <span className="block truncate text-xs text-content-muted">{caption}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-content-subtle" aria-hidden />
    </Link>
  )
}

export function Entreno() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { log, getEntry, toggleCompleted } = useTrainingLog()

  const streaks = useMemo(() => computeStreaks(PLAN, log, iso), [log, iso])
  const kmTotal = useMemo(() => {
    let total = 0
    for (const d of PLAN) for (const s of d.sessions) total += kmForEntry(s, log[s.id]).km
    return total
  }, [log])

  const sessions = day?.sessions ?? []
  const done = sessions.filter((s) => getEntry(s.id)?.completed).length

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={formatFull(iso)}
        title="Entreno"
        description={<>Camino al {GOAL_DISTANCE_KM}K del 5 de agosto.</>}
        actions={
          <Link
            to="/semana"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-2"
          >
            <CalendarDays size={16} aria-hidden />
            Ver la semana
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Racha"
          value={String(streaks.current)}
          unit={streaks.current === 1 ? 'día' : 'días'}
          Icon={Flame}
          tone="bg-cat-soft-orange text-cat-orange"
          caption={`mejor: ${streaks.best}`}
        />
        <StatCard
          label="Km acumulados"
          value={kmTotal.toFixed(1)}
          unit="km"
          Icon={MapPin}
          tone="bg-cat-soft-rose text-cat-rose"
          caption="registrados + plan"
        />
        <StatCard
          label="Hoy"
          value={sessions.length === 0 ? 'Descanso' : `${done}/${sessions.length}`}
          Icon={Dumbbell}
          tone="bg-cat-soft-violet text-cat-violet"
          caption={sessions.length === 0 ? 'día libre' : 'sesiones hechas'}
        />
        <StatCard
          label="Meta"
          value={String(GOAL_DISTANCE_KM)}
          unit="km"
          Icon={TrendingUp}
          tone="bg-cat-soft-green text-cat-green"
          caption="5 de agosto"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Sesiones de hoy" />
          {sessions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => {
                const completed = getEntry(s.id)?.completed
                return (
                  <div key={s.id} className="flex flex-col gap-2">
                    <SessionCard session={s} date={day!.date} completed={completed} />
                    <Button
                      size="sm"
                      variant={completed ? 'secondary' : 'primary'}
                      onClick={() => toggleCompleted(s.id)}
                      className={completed ? 'self-start bg-ok-soft text-ok' : 'self-start'}
                    >
                      {completed ? 'Hecho' : 'Completar'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-surface-2 p-4 text-sm text-content-muted">
              Descanso — no hay entreno para hoy.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          {LINKS.map((l) => (
            <AccessCard key={l.to} {...l} />
          ))}
        </div>
      </div>

      {day?.note && (
        <p className="rounded-2xl bg-surface-2 p-3.5 text-sm leading-relaxed text-content-muted">
          {day.note}
        </p>
      )}
    </div>
  )
}
