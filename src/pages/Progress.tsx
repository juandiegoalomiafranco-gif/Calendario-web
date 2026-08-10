import { useMemo } from 'react'
import {
  Activity,
  Dumbbell,
  FaceGrinning,
  FaceNeutral,
  FaceSlightlyFrowning,
  FaceSlightlySmiling,
  Flame,
  Footprints,
  Goal,
  type LucideIcon,
  MapPin,
  Moon,
  Ruler,
  Shuffle,
  Target,
  Timer,
  TrendingUp,
  Volleyball,
  WavesLadder,
} from 'lucide-react'
import { PLAN, GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../data/plan'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { Card, Section } from '../components/ui/Card'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { chunkIntoWeeks } from '../lib/weeks'
import { daysBetween, formatShort } from '../lib/dates'
import { allSessionsWithDate } from '../lib/planQuery'
import {
  completionRate,
  computeStreaks,
  isRunning,
  kmByCategory,
  kmForEntry,
  sessionCategory,
  type Category,
} from '../lib/stats'
import type { LogEntry } from '../data/types'

interface CategoryMeta {
  Icon: LucideIcon
  label: string
  colorClass: string
  toneClass: string
}

const CATEGORY_META: Record<Category, CategoryMeta> = {
  running: {
    Icon: Footprints,
    label: 'Running',
    colorClass: 'bg-act-run',
    toneClass: 'bg-act-soft-run text-act-run',
  },
  natacion: {
    Icon: WavesLadder,
    label: 'Natación',
    colorClass: 'bg-act-swim',
    toneClass: 'bg-act-soft-swim text-act-swim',
  },
  funcional: {
    Icon: Dumbbell,
    label: 'Funcional',
    colorClass: 'bg-act-strength',
    toneClass: 'bg-act-soft-strength text-act-strength',
  },
  futbol: {
    Icon: Goal,
    label: 'Fútbol',
    colorClass: 'bg-act-flex',
    toneClass: 'bg-act-soft-flex text-act-flex',
  },
  voley: {
    Icon: Volleyball,
    label: 'Vóley',
    colorClass: 'bg-warn',
    toneClass: 'bg-warn-soft text-warn',
  },
  flex: {
    Icon: Shuffle,
    label: 'Flex (sin detalle)',
    colorClass: 'bg-act-rest',
    toneClass: 'bg-act-soft-rest text-act-rest',
  },
  descanso: {
    Icon: Moon,
    label: 'Descanso',
    colorClass: 'bg-act-rest',
    toneClass: 'bg-act-soft-rest text-act-rest',
  },
}

const FEELING_META: {
  id: NonNullable<LogEntry['feeling']>
  Icon: LucideIcon
  label: string
  colorClass: string
  toneClass: string
}[] = [
  {
    id: 'genial',
    Icon: FaceGrinning,
    label: 'Genial',
    colorClass: 'bg-ok',
    toneClass: 'bg-ok-soft text-ok',
  },
  {
    id: 'bien',
    Icon: FaceSlightlySmiling,
    label: 'Bien',
    colorClass: 'bg-act-swim',
    toneClass: 'bg-act-soft-swim text-act-swim',
  },
  {
    id: 'regular',
    Icon: FaceNeutral,
    label: 'Regular',
    colorClass: 'bg-warn',
    toneClass: 'bg-warn-soft text-warn',
  },
  {
    id: 'cargado',
    Icon: FaceSlightlyFrowning,
    label: 'Cargado',
    colorClass: 'bg-act-goal',
    toneClass: 'bg-act-soft-goal text-act-goal',
  },
]

export function Progress() {
  const { log } = useTrainingLog()
  const iso = todayISO()

  const allSessions = useMemo(() => allSessionsWithDate(), [])

  const { done: completedCount, planned: totalPlanned, pct: completionPct } = useMemo(
    () => completionRate(PLAN, log, iso),
    [log, iso],
  )

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
        const doneCount = past.filter((s) => log[s.id]?.completed).length
        const pct = past.length ? Math.round((doneCount / past.length) * 100) : 0
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
    const rows = FEELING_META.map((f) => ({
      key: f.id,
      Icon: f.Icon,
      label: f.label,
      colorClass: f.colorClass,
      toneClass: f.toneClass,
      count: counts.get(f.id) ?? 0,
    }))
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
        .map((s) => ({ label: formatShort(s.date), value: log[s.id]!.avgHr! })),
    [completedRuns, log],
  )

  const runDistanceTrend = useMemo(
    () =>
      completedRuns
        .map((s) => ({ label: formatShort(s.date), value: kmForEntry(s, log[s.id]).km }))
        .filter((p) => p.value > 0),
    [completedRuns, log],
  )

  const paceTrend = useMemo(
    () =>
      completedRuns
        .map((s) => {
          const kmRun = kmForEntry(s, log[s.id]).km
          const dur = log[s.id]?.durationMin
          return { label: formatShort(s.date), value: kmRun > 0 && dur ? dur / kmRun : 0 }
        })
        .filter((p) => p.value > 0),
    [completedRuns, log],
  )

  const runStats = useMemo(() => {
    const runsWithKm = completedRuns.map((s) => kmForEntry(s, log[s.id]).km).filter((v) => v > 0)
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

  const daysRemaining = daysBetween(iso, GOAL_DATE)
  const longestRunPct = Math.min(100, (km.longestRun / GOAL_DISTANCE_KM) * 100)

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-content lg:text-4xl">Progreso</h1>
        <p className="mt-1 text-sm text-content-muted">
          Todo lo que llevas registrado desde que arrancó el plan.
        </p>
      </header>

      {/* Resumen: cumplimiento y fondo más largo */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="lg" className="flex items-center gap-5">
          <ProgressRing value={completionPct} size={104} strokeWidth={11}>
            <span className="text-2xl font-bold tabular text-content">{completionPct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm text-content-muted">Sesiones completadas</p>
            <p className="text-xl font-bold tabular text-content">
              {completedCount} / {totalPlanned}
            </p>
            <p className="mt-2 text-sm text-content-muted">
              {daysRemaining > 0
                ? `Faltan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} para el intento de ${GOAL_DISTANCE_KM} km`
                : daysRemaining === 0
                  ? `Hoy es el intento de ${GOAL_DISTANCE_KM} km`
                  : `El plan terminó — meta de ${GOAL_DISTANCE_KM} km`}
            </p>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col justify-center lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-content">
              <Target size={16} className="text-brand" aria-hidden />
              Tu fondo más largo
            </p>
            <p className="text-sm font-bold tabular text-content">
              {km.longestRun.toFixed(1)}
              <span className="font-medium text-content-subtle"> / {GOAL_DISTANCE_KM} km</span>
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ok to-act-flex"
              style={{ width: `${longestRunPct}%`, transition: 'width 0.3s ease' }}
            />
          </div>
          <p className="mt-2 text-xs text-content-subtle">
            {longestRunPct >= 100
              ? '¡Distancia de meta alcanzada!'
              : `Te falta ${(GOAL_DISTANCE_KM - km.longestRun).toFixed(1)} km para la distancia de meta.`}
          </p>
        </Card>
      </div>

      {/* Cifras */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Entrenos"
          value={String(workoutsDone)}
          Icon={Activity}
          tone="bg-act-soft-strength text-act-strength"
          caption="sesiones completadas"
        />
        <StatCard
          label="Racha"
          value={String(streaks.current)}
          unit={streaks.current === 1 ? 'día' : 'días'}
          Icon={Flame}
          tone="bg-act-soft-run text-act-run"
          caption={`mejor: ${streaks.best} ${streaks.best === 1 ? 'día' : 'días'}`}
        />
        <StatCard
          label="Km acumulados"
          value={km.total.toFixed(1)}
          unit="km"
          Icon={MapPin}
          tone="bg-act-soft-goal text-act-goal"
          caption={
            km.estimated > 0
              ? `${km.registered.toFixed(1)} km registrados · ${km.estimated.toFixed(1)} estimados`
              : 'todo registrado por ti'
          }
        />
        <StatCard
          label="Km corriendo"
          value={km.running.toFixed(1)}
          unit="km"
          Icon={Footprints}
          tone="bg-act-soft-run text-act-run"
          caption={`meta: ${GOAL_DISTANCE_KM} km seguidos`}
        />

        {totals.durationMin > 0 && (
          <StatCard
            label="Tiempo total"
            value={
              totals.durationMin >= 60
                ? `${Math.floor(totals.durationMin / 60)}h ${totals.durationMin % 60}`
                : String(totals.durationMin)
            }
            unit="min"
            Icon={Timer}
            tone="bg-act-soft-swim text-act-swim"
            caption="entrenando"
          />
        )}
        {totals.calories > 0 && (
          <StatCard
            label="Calorías"
            value={totals.calories.toLocaleString('es-CO')}
            unit="kcal"
            Icon={Flame}
            tone="bg-warn-soft text-warn"
            caption="quemadas (registradas)"
          />
        )}
        {runStats.count > 0 && (
          <StatCard
            label="Promedio por carrera"
            value={runStats.avgPerRun.toFixed(1)}
            unit="km"
            Icon={Ruler}
            tone="bg-act-soft-run text-act-run"
            caption={`en ${runStats.count} ${runStats.count === 1 ? 'carrera' : 'carreras'}`}
          />
        )}
        {weekDelta && (
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

      {/* Gráficos */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Section title="Km por semana">
          <WeeklyBars bars={kmPerWeek} />
        </Section>

        <Section title="Cumplimiento por semana">
          <WeeklyBars bars={completionPerWeek} max={100} />
        </Section>

        {byActivity.length > 0 && (
          <Section title="Por actividad">
            <BreakdownBars rows={byActivity} />
          </Section>
        )}

        {kmByType.length > 0 && (
          <Section title="Km por tipo">
            <BreakdownBars rows={kmByType} suffix=" km" />
          </Section>
        )}

        {feelings.total > 0 && (
          <Section title="Sensaciones">
            <BreakdownBars rows={feelings.rows} />
          </Section>
        )}

        {runDistanceTrend.length >= 2 && (
          <Section title="Distancia por carrera">
            <TrendLine
              points={runDistanceTrend}
              unit="km por carrera"
              title="Distancia de cada carrera completada"
              color="rgb(var(--act-run))"
            />
          </Section>
        )}

        {paceTrend.length >= 2 && (
          <Section title="Ritmo por carrera">
            <TrendLine
              points={paceTrend}
              unit="min/km (más bajo es más rápido)"
              title="Ritmo medio de cada carrera"
              color="rgb(var(--ok))"
            />
          </Section>
        )}

        {hrTrend.length >= 2 && (
          <Section title="FC media en carrera">
            <TrendLine
              points={hrTrend}
              unit="pulsaciones por minuto"
              title="Frecuencia cardíaca media por carrera"
              color="rgb(var(--act-swim))"
              decimals={0}
            />
          </Section>
        )}
      </div>
    </div>
  )
}
