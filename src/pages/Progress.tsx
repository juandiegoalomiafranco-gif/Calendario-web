import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PROGRAM_START, getRange } from '../data/plan'
import { formatKm } from '../data/program'
import { StatCard } from '../components/StatCard'
import { ProgressRing } from '../components/ProgressRing'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { useGoals } from '../hooks/useGoals'
import {
  computeStreaks,
  formatMinutes,
  kmByCategory,
  lastFinishedWeekDelta,
  runStats,
  runTrends,
  sessionCategory,
  summarize,
  weekSummaries,
  type Category,
  type TrendPoint,
} from '../lib/stats'
import { daysBetween, todayISO } from '../lib/dates'
import type { LogEntry } from '../data/types'

/** Semanas que se muestran en las gráficas: el plan es infinito, la vista no. */
const WEEKS_SHOWN = 12

const CATEGORY_META: Record<Category, { emoji: string; label: string; colorClass: string }> = {
  running: { emoji: '🏃', label: 'Running', colorClass: 'bg-brand-500' },
  natacion: { emoji: '🏊', label: 'Natación', colorClass: 'bg-sky-500' },
  funcional: { emoji: '🏋️', label: 'Funcional', colorClass: 'bg-ink-700' },
  futbol: { emoji: '⚽', label: 'Fútbol', colorClass: 'bg-ok-500' },
  voley: { emoji: '🏐', label: 'Vóley', colorClass: 'bg-amber-400' },
  flex: { emoji: '🎲', label: 'Flex (sin detalle)', colorClass: 'bg-ink-400' },
  descanso: { emoji: '😴', label: 'Descanso', colorClass: 'bg-ink-300' },
}

const FEELING_META: { id: NonNullable<LogEntry['feeling']>; emoji: string; label: string; colorClass: string }[] = [
  { id: 'genial', emoji: '😄', label: 'Genial', colorClass: 'bg-ok-500' },
  { id: 'bien', emoji: '🙂', label: 'Bien', colorClass: 'bg-sky-500' },
  { id: 'regular', emoji: '😐', label: 'Regular', colorClass: 'bg-amber-400' },
  { id: 'cargado', emoji: '😖', label: 'Cargado', colorClass: 'bg-brand-600' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Una tendencia necesita al menos dos puntos. Cuando no los hay lo dice, en vez
 * de desaparecer y dejar la página cambiando de forma sin explicación.
 */
function TrendSection({
  title,
  points,
  unit,
  hint,
  colorClass,
  format,
}: {
  title: string
  points: TrendPoint[]
  unit: string
  hint: string
  colorClass?: string
  format?: (v: number) => string
}) {
  return (
    <Section title={title}>
      {points.length >= 2 ? (
        <TrendLine points={points} unit={unit} colorClass={colorClass} format={format} />
      ) : (
        <p className="rounded-3xl bg-card shadow-card p-4 text-sm text-ink-500">
          {hint} {points.length === 1 ? '(llevas 1)' : '(no llevas ninguna)'}
        </p>
      )}
    </Section>
  )
}

export function Progress() {
  const { log } = useTrainingLog()
  const { activeGoal } = useGoals()
  const iso = todayISO()

  // El plan se genera sin fin, así que las estadísticas se acotan a lo vivido:
  // del arranque del programa hasta hoy.
  const days = useMemo(() => getRange(PROGRAM_START, iso, activeGoal), [iso, activeGoal])
  const summary = useMemo(() => summarize(days, log), [days, log])
  const streaks = useMemo(() => computeStreaks(days, log, iso), [days, log, iso])
  const weeks = useMemo(() => weekSummaries(days, log, iso, WEEKS_SHOWN), [days, log, iso])
  const weekDelta = useMemo(() => lastFinishedWeekDelta(weeks), [weeks])
  const trends = useMemo(() => runTrends(summary.sessions, log), [summary.sessions, log])
  const runs = useMemo(() => runStats(summary.sessions, log), [summary.sessions, log])

  const kmByType = useMemo(() => {
    const counts = kmByCategory(summary.sessions, log)
    return (Object.keys(CATEGORY_META) as Category[])
      .filter((c) => c !== 'descanso' && (counts.get(c) ?? 0) > 0)
      .map((c) => ({ key: c, ...CATEGORY_META[c], count: Number((counts.get(c) ?? 0).toFixed(1)) }))
  }, [summary.sessions, log])

  const byActivity = useMemo(() => {
    const counts = new Map<Category, number>()
    for (const s of summary.sessions) {
      const entry = log[s.id]
      if (!entry?.completed || s.type === 'rest') continue
      const cat = sessionCategory(s, entry)
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return (Object.keys(CATEGORY_META) as Category[])
      .filter((c) => c !== 'descanso' && (counts.get(c) ?? 0) > 0)
      .map((c) => ({ key: c, ...CATEGORY_META[c], count: counts.get(c) ?? 0 }))
  }, [summary.sessions, log])

  const feelings = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of summary.sessions) {
      const entry = log[s.id]
      if (entry?.completed && entry.feeling) counts.set(entry.feeling, (counts.get(entry.feeling) ?? 0) + 1)
    }
    const rows = FEELING_META.map((f) => ({
      key: f.id,
      emoji: f.emoji,
      label: f.label,
      colorClass: f.colorClass,
      count: counts.get(f.id) ?? 0,
    }))
    return { rows, total: rows.reduce((a, r) => a + r.count, 0) }
  }, [summary.sessions, log])

  const kmPerWeek = useMemo(
    () =>
      weeks.map((w) => ({
        label: w.label,
        value: w.km,
        display: w.km ? w.km.toFixed(1) : '0',
        to: `/semana?desde=${w.start}`,
        inProgress: w.inProgress,
      })),
    [weeks],
  )

  const completionPerWeek = useMemo(
    () =>
      weeks.map((w) => ({
        label: w.label,
        value: w.completionPct,
        display: `${w.completionPct}%`,
        to: `/semana?desde=${w.start}`,
        inProgress: w.inProgress,
      })),
    [weeks],
  )

  const daysRemaining = activeGoal ? Math.max(0, daysBetween(iso, activeGoal.targetDate)) : null
  const goalKm = activeGoal?.targetKm
  const { km, totals } = summary

  // Estado vacío de verdad: sin nada registrado, los ceros y las columnas grises
  // se leían como una pantalla rota.
  if (!summary.hasAnyLog) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-3xl font-bold text-ink-900">Progreso</h1>
        </header>
        <div className="rounded-3xl bg-card shadow-card p-5 flex flex-col gap-3 items-start">
          <p className="text-5xl" aria-hidden>
            📈
          </p>
          <p className="text-base font-semibold text-ink-900">Aún no has registrado nada</p>
          <p className="text-sm text-ink-500">
            Marca tu primera sesión como completada y aquí aparecerán tus kilómetros, tus rachas y cómo va cambiando tu
            ritmo.
          </p>
          <Link
            to="/"
            className="min-h-[44px] px-5 inline-flex items-center rounded-full bg-brand-500 text-white font-semibold"
          >
            Ir al entrenamiento de hoy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Progreso</h1>
      </header>

      <div className="rounded-3xl bg-card shadow-card p-5 flex items-center gap-5">
        <ProgressRing value={summary.completionPct} size={104} strokeWidth={12}>
          <div className="text-center">
            <p className="text-2xl font-bold text-ink-900">{summary.completionPct}%</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-sm text-ink-500">Entrenamientos completados</p>
          <p className="text-xl font-bold text-ink-900">
            {summary.completedTrainings} / {summary.trainings.length}
          </p>
          {summary.completedRests > 0 && (
            <p className="text-[11px] text-ink-400">y {summary.completedRests} descansos marcados</p>
          )}
          {activeGoal && daysRemaining !== null && (
            <p className="text-sm text-ink-500 mt-2">
              Faltan {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} para {activeGoal.title}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <StatCard label="Entrenos" value={String(summary.completedTrainings)} icon="entrenos" caption="sesiones completadas" />
        <StatCard
          label="Racha"
          value={String(streaks.current)}
          unit={streaks.current === 1 ? 'día' : 'días'}
          icon="racha"
          caption={`mejor: ${streaks.best} ${streaks.best === 1 ? 'día' : 'días'}`}
        />
      </div>

      <div className="flex gap-3">
        <StatCard
          label="Km acumulados"
          value={km.total.toFixed(1)}
          unit="km"
          icon="distancia"
          caption={
            km.estimated > 0
              ? `${km.registered.toFixed(1)} km registrados · ${km.estimated.toFixed(1)} km estimados del plan`
              : 'todo registrado por ti'
          }
        />
        <StatCard
          label="Km corriendo"
          value={km.running.toFixed(1)}
          unit="km"
          icon="correr"
          caption={goalKm ? `meta: ${formatKm(goalKm)} km seguidos` : 'total acumulado'}
        />
      </div>

      {(totals.durationMin > 0 || totals.calories > 0) && (
        <div className="flex gap-3">
          <StatCard
            label="Tiempo total"
            value={
              totals.durationMin >= 60
                ? `${Math.floor(totals.durationMin / 60)}h ${totals.durationMin % 60}`
                : String(totals.durationMin)
            }
            unit="min"
            icon="tiempo"
            caption="entrenando"
          />
          <StatCard
            label="Calorías"
            value={totals.calories.toLocaleString('es-CO')}
            unit="kcal"
            icon="energia"
            caption="quemadas (registradas)"
          />
        </div>
      )}

      {runs.count > 0 && (
        <div className="flex gap-3">
          <StatCard
            label="Promedio por carrera"
            value={runs.avgPerRun.toFixed(1)}
            unit="km"
            icon="regla"
            caption={`en ${runs.count} ${runs.count === 1 ? 'carrera' : 'carreras'}`}
          />
          {weekDelta && (
            <StatCard
              label="Última semana completa"
              value={weekDelta.last.toFixed(1)}
              unit="km"
              icon="tendencia"
              caption={
                weekDelta.delta === 0
                  ? 'igual que la anterior'
                  : `${weekDelta.delta > 0 ? '+' : ''}${weekDelta.delta.toFixed(1)} km vs. anterior`
              }
            />
          )}
        </div>
      )}

      {goalKm ? (
        <div className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-ink-900">🎯 Tu fondo más largo</p>
            <p className="text-sm font-bold text-ink-900">
              {km.longestRun.toFixed(1)} <span className="text-ink-400 font-medium">/ {formatKm(goalKm)} km</span>
            </p>
          </div>
          <div className="h-3 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-ok-500"
              style={{ width: `${Math.min(100, (km.longestRun / goalKm) * 100)}%`, transition: 'width 0.3s ease' }}
            />
          </div>
        </div>
      ) : (
        km.longestRun > 0 && (
          <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">🎯 Tu fondo más largo</p>
            <p className="text-sm font-bold text-ink-900">{km.longestRun.toFixed(1)} km</p>
          </div>
        )
      )}

      <Section title="Km por semana">
        <WeeklyBars bars={kmPerWeek} />
      </Section>

      {byActivity.length > 0 && (
        <Section title="Por actividad">
          <BreakdownBars rows={byActivity} unit="sesiones" unitOne="sesión" />
        </Section>
      )}

      {kmByType.length > 0 && (
        <Section title="Km por tipo">
          <BreakdownBars rows={kmByType} unit="km" />
        </Section>
      )}

      {feelings.total > 0 && (
        <Section title="Sensaciones">
          <BreakdownBars rows={feelings.rows} unit="veces" unitOne="vez" />
        </Section>
      )}

      <TrendSection
        title="Distancia por carrera"
        points={trends.distance}
        unit="km por carrera · toca un punto para ver el día"
        hint="Necesitas 2 carreras registradas para ver la tendencia"
      />

      <TrendSection
        title="Ritmo por carrera"
        points={trends.pace}
        unit="min/km (más bajo es más rápido) · toca un punto para ver el día"
        hint="Necesitas 2 carreras con distancia y duración para ver el ritmo"
        colorClass="text-ok-500"
        format={formatMinutes}
      />

      <Section title="Cumplimiento por semana">
        <WeeklyBars bars={completionPerWeek} max={100} />
      </Section>
    </div>
  )
}
