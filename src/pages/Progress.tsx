import { useMemo } from 'react'
import { Activity, Dumbbell, FaceGrinning, FaceNeutral, FaceSlightlyFrowning, FaceSlightlySmiling, Flame, Footprints, Goal, Moon, Shuffle, Timer, Volleyball, WavesLadder, type LucideIcon } from 'lucide-react'
import { PLAN, todayISO } from '../data/plan'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { chunkIntoWeeks } from '../lib/weeks'
import { computeStreaks, isRunning, sessionCategory, type Category } from '../lib/stats'
import type { LogEntry } from '../data/types'

const CATEGORY_META: Record<Category, { Icon: LucideIcon; label: string; colorClass: string; toneClass: string }> = {
  running: { Icon: Footprints, label: 'Running', colorClass: 'bg-cat-orange', toneClass: 'bg-cat-soft-orange text-cat-orange' },
  natacion: { Icon: WavesLadder, label: 'Natación', colorClass: 'bg-cat-cyan', toneClass: 'bg-cat-soft-cyan text-cat-cyan' },
  funcional: { Icon: Dumbbell, label: 'Funcional', colorClass: 'bg-cat-violet', toneClass: 'bg-cat-soft-violet text-cat-violet' },
  futbol: { Icon: Goal, label: 'Fútbol', colorClass: 'bg-cat-green', toneClass: 'bg-cat-soft-green text-cat-green' },
  voley: { Icon: Volleyball, label: 'Vóley', colorClass: 'bg-cat-amber', toneClass: 'bg-cat-soft-amber text-cat-amber' },
  flex: { Icon: Shuffle, label: 'Flex (sin detalle)', colorClass: 'bg-cat-slate', toneClass: 'bg-cat-soft-slate text-cat-slate' },
  descanso: { Icon: Moon, label: 'Descanso', colorClass: 'bg-cat-slate', toneClass: 'bg-cat-soft-slate text-cat-slate' },
}

const FEELING_META: { id: NonNullable<LogEntry['feeling']>; Icon: LucideIcon; label: string; colorClass: string; toneClass: string }[] = [
  { id: 'genial', Icon: FaceGrinning, label: 'Genial', colorClass: 'bg-cat-green', toneClass: 'bg-cat-soft-green text-cat-green' },
  { id: 'bien', Icon: FaceSlightlySmiling, label: 'Bien', colorClass: 'bg-cat-blue', toneClass: 'bg-cat-soft-blue text-cat-blue' },
  { id: 'regular', Icon: FaceNeutral, label: 'Regular', colorClass: 'bg-cat-amber', toneClass: 'bg-cat-soft-amber text-cat-amber' },
  { id: 'cargado', Icon: FaceSlightlyFrowning, label: 'Cargado', colorClass: 'bg-cat-rose', toneClass: 'bg-cat-soft-rose text-cat-rose' },
]

function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

export function Progress() {
  const { log } = useTrainingLog()
  const iso = todayISO()

  const allSessions = useMemo(() => PLAN.flatMap((d) => d.sessions.map((s) => ({ ...s, date: d.date }))), [])
  const pastOrTodaySessions = useMemo(() => allSessions.filter((s) => s.date <= iso), [allSessions, iso])

  const completedCount = pastOrTodaySessions.filter((s) => log[s.id]?.completed).length
  const totalPlanned = pastOrTodaySessions.length
  const completionPct = totalPlanned ? Math.round((completedCount / totalPlanned) * 100) : 0

  const workoutsDone = useMemo(
    () => allSessions.filter((s) => s.type !== 'rest' && log[s.id]?.completed).length,
    [allSessions, log],
  )

  const streaks = useMemo(() => computeStreaks(PLAN, log, iso), [log, iso])

  const totals = useMemo(() => {
    let durationMin = 0
    let calories = 0
    for (const s of allSessions) {
      const entry = log[s.id]
      if (!entry?.completed) continue
      if (entry.durationMin) durationMin += entry.durationMin
      if (entry.calories) calories += entry.calories
    }
    return { durationMin, calories }
  }, [allSessions, log])

  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])

  const completionPerWeek = useMemo(
    () =>
      weeks.map((week, i) => {
        const past = week.filter((d) => d.date <= iso).flatMap((d) => d.sessions)
        const done = past.filter((s) => log[s.id]?.completed).length
        const pct = past.length ? Math.round((done / past.length) * 100) : 0
        return { label: `Sem ${i + 1}`, value: pct, display: `${pct}%` }
      }),
    [weeks, log, iso],
  )

  const minutesPerWeek = useMemo(
    () =>
      weeks.map((week, i) => {
        const value = week.reduce(
          (sum, day) =>
            sum +
            day.sessions.reduce((s, sess) => {
              const entry = log[sess.id]
              return s + (entry?.completed ? entry.durationMin ?? 0 : 0)
            }, 0),
          0,
        )
        return { label: `Sem ${i + 1}`, value, display: value ? String(value) : '0' }
      }),
    [weeks, log],
  )

  const byActivity = useMemo(() => {
    const counts = new Map<Category, number>()
    for (const s of allSessions) {
      const entry = log[s.id]
      if (!entry?.completed || s.type === 'rest') continue
      const cat = sessionCategory(s, entry)
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return (Object.keys(CATEGORY_META) as Category[])
      .filter((c) => c !== 'descanso' && (counts.get(c) ?? 0) > 0)
      .map((c) => ({ key: c, ...CATEGORY_META[c], count: counts.get(c) ?? 0 }))
  }, [allSessions, log])

  const feelings = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of allSessions) {
      const entry = log[s.id]
      if (entry?.completed && entry.feeling) counts.set(entry.feeling, (counts.get(entry.feeling) ?? 0) + 1)
    }
    const rows = FEELING_META.map((f) => ({ key: f.id, Icon: f.Icon, label: f.label, colorClass: f.colorClass, toneClass: f.toneClass, count: counts.get(f.id) ?? 0 }))
    return { rows, total: rows.reduce((a, r) => a + r.count, 0) }
  }, [allSessions, log])

  const completedRuns = useMemo(
    () =>
      allSessions
        .filter((s) => isRunning(s.type) && log[s.id]?.completed)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [allSessions, log],
  )

  const hrTrend = useMemo(
    () =>
      completedRuns
        .filter((s) => log[s.id]?.avgHr != null)
        .map((s) => ({ label: shortDate(s.date), value: log[s.id]!.avgHr! })),
    [completedRuns, log],
  )

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Entreno"
        title="Progreso"
        description="Cómo vas con el plan: constancia, tiempo y sensaciones."
      />

      {/* Resumen: anillo de cumplimiento */}
      <Card padding="lg" className="flex items-center gap-5">
        <ProgressRing value={completionPct} size={104} strokeWidth={12}>
          <div className="text-center">
            <p className="text-2xl font-extrabold tabular text-content">{completionPct}%</p>
          </div>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm text-content-muted">Sesiones completadas</p>
          <p className="text-2xl font-extrabold tabular text-content">
            {completedCount} / {totalPlanned}
          </p>
          <p className="mt-2 text-sm text-content-muted">
            {workoutsDone} {workoutsDone === 1 ? 'entreno hecho' : 'entrenos hechos'} en todo el
            plan
          </p>
        </div>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Entrenos"
          value={String(workoutsDone)}
          Icon={Activity}
          tone="bg-cat-soft-violet text-cat-violet"
          caption="sesiones completadas"
        />
        <StatCard
          label="Racha"
          value={String(streaks.current)}
          unit={streaks.current === 1 ? 'día' : 'días'}
          Icon={Flame}
          tone="bg-cat-soft-orange text-cat-orange"
          caption={`mejor: ${streaks.best} ${streaks.best === 1 ? 'día' : 'días'}`}
        />

        {(totals.durationMin > 0 || totals.calories > 0) && (
          <>
            <StatCard
              label="Tiempo total"
              value={
                totals.durationMin >= 60
                  ? `${Math.floor(totals.durationMin / 60)}h ${totals.durationMin % 60}`
                  : String(totals.durationMin)
              }
              unit="min"
              Icon={Timer}
              tone="bg-cat-soft-cyan text-cat-cyan"
              caption="entrenando"
            />
            <StatCard
              label="Calorías"
              value={totals.calories.toLocaleString('es-CO')}
              unit="kcal"
              Icon={Flame}
              tone="bg-cat-soft-orange text-cat-orange"
              caption="quemadas (registradas)"
            />
          </>
        )}
      </div>

      {/* Gráficas — dos columnas en escritorio */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <CardHeader title="Cumplimiento por semana" />
          <WeeklyBars bars={completionPerWeek} max={100} />
        </Card>

        <Card>
          <CardHeader title="Minutos por semana" />
          <WeeklyBars bars={minutesPerWeek} />
        </Card>

        {byActivity.length > 0 && (
          <Card>
            <CardHeader title="Por actividad" />
            <BreakdownBars rows={byActivity} />
          </Card>
        )}

        {feelings.total > 0 && (
          <Card>
            <CardHeader title="Sensaciones" />
            <BreakdownBars rows={feelings.rows} />
          </Card>
        )}

        {hrTrend.length >= 2 && (
          <Card>
            <CardHeader title="FC media en carrera" />
            <TrendLine
              points={hrTrend}
              unit="pulsaciones por minuto"
              color="rgb(var(--cat-blue))"
              decimals={0}
            />
          </Card>
        )}
      </div>
    </div>
  )
}
