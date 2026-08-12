import { useMemo } from 'react'
import { Activity, Dumbbell, FaceGrinning, FaceNeutral, FaceSlightlyFrowning, FaceSlightlySmiling, Flame, Footprints, Goal, MapPin, Moon, Ruler, Shuffle, Target, Timer, TrendingUp, Volleyball, WavesLadder, type LucideIcon } from 'lucide-react'
import { PLAN, GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../data/plan'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { chunkIntoWeeks } from '../lib/weeks'
import { computeStreaks, isRunning, kmByCategory, kmForEntry, sessionCategory, type Category } from '../lib/stats'
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

  const km = useMemo(() => {
    let total = 0
    let registered = 0
    let estimated = 0
    let running = 0
    let longestRun = 0
    for (const s of allSessions) {
      const r = kmForEntry(s, log[s.id])
      total += r.km
      if (r.estimated) estimated += r.km
      else registered += r.km
      if (isRunning(s.type)) {
        running += r.km
        longestRun = Math.max(longestRun, r.km)
      }
    }
    return { total, registered, estimated, running, longestRun }
  }, [allSessions, log])

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

  const kmByType = useMemo(() => {
    const counts = kmByCategory(allSessions, log)
    return (Object.keys(CATEGORY_META) as Category[])
      .filter((c) => c !== 'descanso' && (counts.get(c) ?? 0) > 0)
      .map((c) => ({ key: c, ...CATEGORY_META[c], count: Number((counts.get(c) ?? 0).toFixed(1)) }))
  }, [allSessions, log])

  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])

  const kmPerWeek = useMemo(
    () =>
      weeks.map((week, i) => {
        const value = week.reduce(
          (sum, day) => sum + day.sessions.reduce((s, sess) => s + kmForEntry(sess, log[sess.id]).km, 0),
          0,
        )
        return { label: `Sem ${i + 1}`, value, display: value ? value.toFixed(1) : '0' }
      }),
    [weeks, log],
  )

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

  const runDistanceTrend = useMemo(
    () =>
      completedRuns
        .map((s) => ({ label: shortDate(s.date), value: kmForEntry(s, log[s.id]).km }))
        .filter((p) => p.value > 0),
    [completedRuns, log],
  )

  const paceTrend = useMemo(
    () =>
      completedRuns
        .map((s) => {
          const km = kmForEntry(s, log[s.id]).km
          const dur = log[s.id]?.durationMin
          return { label: shortDate(s.date), value: km > 0 && dur ? dur / km : 0 }
        })
        .filter((p) => p.value > 0),
    [completedRuns, log],
  )

  const runStats = useMemo(() => {
    const runsWithKm = completedRuns
      .map((s) => kmForEntry(s, log[s.id]).km)
      .filter((v) => v > 0)
    const avgPerRun = runsWithKm.length ? km.running / runsWithKm.length : 0
    return { count: runsWithKm.length, avgPerRun }
  }, [completedRuns, log, km.running])

  const weekDelta = useMemo(() => {
    const withValue = kmPerWeek.filter((w) => w.value > 0)
    if (withValue.length < 2) return null
    const last = withValue[withValue.length - 1].value
    const prev = withValue[withValue.length - 2].value
    return { last, delta: last - prev }
  }, [kmPerWeek])

  const daysRemaining = Math.max(
    0,
    Math.round((new Date(`${GOAL_DATE}T00:00:00Z`).getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000),
  )

  const longestRunPct = Math.min(100, (km.longestRun / GOAL_DISTANCE_KM) * 100)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Entreno"
        title="Progreso"
        description={`Faltan ${daysRemaining} días para el intento de ${GOAL_DISTANCE_KM} km.`}
      />

      {/* Resumen: anillo de cumplimiento + fondo más largo */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
        <Card padding="lg" className="flex items-center gap-5 lg:col-span-2">
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

        <Card padding="lg">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-content">
              <Target size={15} aria-hidden /> Tu fondo más largo
            </p>
          </div>
          <p className="text-2xl font-extrabold tabular text-content">
            {km.longestRun.toFixed(1)}{' '}
            <span className="text-base font-medium text-content-subtle">
              / {GOAL_DISTANCE_KM} km
            </span>
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-ok"
              style={{ width: `${longestRunPct}%`, transition: 'width 0.3s ease' }}
            />
          </div>
        </Card>
      </div>

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
        <StatCard
          label="Km acumulados"
          value={km.total.toFixed(1)}
          unit="km"
          Icon={MapPin}
          tone="bg-cat-soft-rose text-cat-rose"
          caption={
            km.estimated > 0
              ? `${km.registered.toFixed(1)} registrados · ${km.estimated.toFixed(1)} del plan`
              : 'todo registrado por ti'
          }
        />
        <StatCard
          label="Km corriendo"
          value={km.running.toFixed(1)}
          unit="km"
          Icon={Footprints}
          tone="bg-cat-soft-orange text-cat-orange"
          caption={`meta: ${GOAL_DISTANCE_KM} km seguidos`}
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

        {runStats.count > 0 && (
          <StatCard
            label="Promedio por carrera"
            value={runStats.avgPerRun.toFixed(1)}
            unit="km"
            Icon={Ruler}
            tone="bg-cat-soft-cyan text-cat-cyan"
            caption={`en ${runStats.count} ${runStats.count === 1 ? 'carrera' : 'carreras'}`}
          />
        )}
        {runStats.count > 0 && weekDelta && (
          <StatCard
            label="Última semana"
            value={weekDelta.last.toFixed(1)}
            unit="km"
            Icon={TrendingUp}
            tone="bg-ok-soft text-ok"
            caption={
              weekDelta.delta === 0
                ? 'igual que la anterior'
                : `${weekDelta.delta > 0 ? '+' : ''}${weekDelta.delta.toFixed(1)} km vs. anterior`
            }
          />
        )}
      </div>

      {/* Gráficas — dos columnas en escritorio */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <CardHeader title="Km por semana" />
          <WeeklyBars bars={kmPerWeek} />
        </Card>

        <Card>
          <CardHeader title="Cumplimiento por semana" />
          <WeeklyBars bars={completionPerWeek} max={100} />
        </Card>

        {byActivity.length > 0 && (
          <Card>
            <CardHeader title="Por actividad" />
            <BreakdownBars rows={byActivity} />
          </Card>
        )}

        {kmByType.length > 0 && (
          <Card>
            <CardHeader title="Km por tipo" />
            <BreakdownBars rows={kmByType} />
          </Card>
        )}

        {feelings.total > 0 && (
          <Card>
            <CardHeader title="Sensaciones" />
            <BreakdownBars rows={feelings.rows} />
          </Card>
        )}

        {runDistanceTrend.length >= 2 && (
          <Card>
            <CardHeader title="Distancia por carrera" />
            <TrendLine points={runDistanceTrend} unit="km por carrera" />
          </Card>
        )}

        {paceTrend.length >= 2 && (
          <Card>
            <CardHeader title="Ritmo por carrera" />
            <TrendLine
              points={paceTrend}
              unit="min/km (más bajo es más rápido)"
              color="rgb(var(--cat-green))"
              decimals={1}
            />
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
