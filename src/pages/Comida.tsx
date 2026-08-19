import { useMemo, useState } from 'react'
import { ChevronDown, Droplets, FlaskConical, Zap } from 'lucide-react'
import { getDayPlan, todayISO } from '../data/plan'
import {
  GENERAL_RULES,
  HOME_MEASURES,
  SCENARIOS,
  SCENARIO_LIST,
  type DietMeal,
  type DietScenario,
  type ScenarioCode,
} from '../data/nutrition'
import { scenarioForDay } from '../lib/nutrition'
import { useCoach } from '../hooks/useCoach'
import { LoncheraCard } from '../components/panels/LoncheraCard'
import { useNutritionDay } from '../hooks/useNutritionLog'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { cx } from '../lib/cx'

const CODES: ScenarioCode[] = ['E1', 'E2', 'E3', 'E4']
type Tab = 'hoy' | 'escenarios' | 'reglas'

const TABS: { value: Tab; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'escenarios', label: 'Escenarios' },
  { value: 'reglas', label: 'Reglas' },
]

export function Comida() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const { sesionesDe } = useCoach()
  // Si el entrenador mandó plan para hoy, manda el suyo sobre el plan estático.
  const sesionesDeHoy = useMemo(
    () => sesionesDe(iso) ?? day?.sessions ?? [],
    [sesionesDe, iso, day],
  )
  const suggested = useMemo(() => scenarioForDay(sesionesDeHoy), [sesionesDeHoy])
  const { mealsDone, scenarioOverride, toggleMeal, setOverride } = useNutritionDay(iso)
  const [tab, setTab] = useState<Tab>('hoy')

  const activeCode = scenarioOverride ?? suggested
  const scenario = SCENARIOS[activeCode]
  const trainingToday = sesionesDeHoy.filter((s) => s.type !== 'rest')

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Comida"
        description="La dieta se ajusta a la carga del día."
        actions={
          <SegmentedControl
            options={TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Vista de comida"
            variant="pill"
          />
        }
      />

      {tab === 'hoy' && (
        <>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
            <div
              className={cx(
                'rounded-3xl p-5 text-on-solid shadow-card lg:col-span-2',
                scenario.color,
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-solid/75">
                {scenarioOverride ? 'Elegido por ti' : 'Sugerido por tu entreno'}
              </p>
              <p className="mt-0.5 text-2xl font-extrabold leading-tight tracking-tight">
                {scenario.code} · {scenario.name}
              </p>
              <p className="mt-1 text-sm text-on-solid/85">{scenario.subtitle}</p>
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-2xl font-extrabold tabular">{scenario.kcal}</p>
                  <p className="text-[11px] text-on-solid/70">kcal aprox.</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold tabular">{scenario.carbsG} g</p>
                  <p className="text-[11px] text-on-solid/70">carbohidratos</p>
                </div>
              </div>
            </div>

            <Card className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">
                  Por qué este escenario
                </p>
                <p className="text-sm text-content">
                  {trainingToday.length > 0
                    ? `Hoy: ${trainingToday.map((s) => s.title).join(' · ')} → ${scenario.name}.`
                    : `Hoy es descanso → ${scenario.name} (aquí vive el déficit).`}
                </p>
                <p className="mt-1 text-[11px] text-content-subtle">
                  Sugerencia — confírmalo con Diego.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
                  Cambiar escenario
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={scenarioOverride ? 'outline' : 'primary'}
                    onClick={() => setOverride(undefined)}
                  >
                    Auto
                  </Button>
                  {CODES.map((c) => (
                    <Button
                      key={c}
                      size="sm"
                      variant={scenarioOverride === c ? 'primary' : 'outline'}
                      onClick={() => setOverride(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
            <LoncheraCard dateIso={iso} escenario={activeCode} />

            {scenario.meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                done={mealsDone.includes(meal.id)}
                onToggle={() => toggleMeal(meal.id)}
              />
            ))}
          </div>

          <RulesCard scenario={scenario} />
        </>
      )}

      {tab === 'escenarios' && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 lg:gap-5">
          {SCENARIO_LIST.map((s) => (
            <ScenarioBlock key={s.code} scenario={s} />
          ))}
        </div>
      )}

      {tab === 'reglas' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          <Card>
            <CardHeader title="Reglas generales" />
            <ul className="flex flex-col gap-2">
              {GENERAL_RULES.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-content-muted">
                  <span className="text-accent" aria-hidden>
                    •
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Medidas caseras" />
            <div className="flex flex-col gap-2">
              {HOME_MEASURES.map((m) => (
                <div
                  key={m.medida}
                  className="flex justify-between gap-3 border-b border-line pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="font-medium text-content">{m.medida}</span>
                  <span className="text-right text-content-muted">{m.equivale}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function MealCard({
  meal,
  done,
  onToggle,
}: {
  meal: DietMeal
  done?: boolean
  onToggle?: () => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Card className={cx('h-full', done && 'opacity-70')}>
      <CardHeader
        title={meal.franja}
        action={
          onToggle && (
            <Button
              size="sm"
              variant={done ? 'secondary' : 'outline'}
              onClick={onToggle}
              className={done ? 'bg-ok-soft text-ok' : undefined}
            >
              {done ? 'Hecha' : 'Marcar'}
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-2">
        {meal.foods.map((food, i) => {
          const key = `${meal.id}-${i}`
          const isOpen = open === key
          const hasSubs = food.sustitutos.length > 0
          return (
            <div key={key} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <button
                type="button"
                className="flex w-full gap-2 text-left"
                onClick={() => setOpen(isOpen ? null : key)}
                aria-expanded={hasSubs ? isOpen : undefined}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-content">{food.alimento}</span>
                  <span className="block text-xs text-content-subtle">{food.medida}</span>
                </span>
                <span className="shrink-0 text-sm tabular text-content-muted">{food.cantidad}</span>
              </button>
              {isOpen && hasSubs && (
                <p className="mt-1 text-xs text-content-muted">
                  <span className="font-semibold">Sustitutos: </span>
                  {food.sustitutos.join(' · ')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RulesCard({ scenario }: { scenario: DietScenario }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-3xl bg-surface-2 p-4 sm:grid-cols-3">
      <p className="flex items-start gap-2 text-sm text-content">
        <Droplets size={15} className="mt-0.5 shrink-0 text-cat-blue" aria-hidden />
        {scenario.hydration}
      </p>
      <p className="flex items-start gap-2 text-sm text-content">
        <Zap size={15} className="mt-0.5 shrink-0 text-cat-amber" aria-hidden />
        {scenario.atomix}
      </p>
      <p className="flex items-start gap-2 text-sm text-content">
        <FlaskConical size={15} className="mt-0.5 shrink-0 text-cat-violet" aria-hidden />
        {scenario.creatina}
      </p>
    </div>
  )
}

function ScenarioBlock({ scenario }: { scenario: DietScenario }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cx('w-full p-4 text-left text-on-solid', scenario.color)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold">
              {scenario.code} · {scenario.name}
            </p>
            <p className="text-xs text-on-solid/75">
              {scenario.kcal} kcal · {scenario.carbsG} g carb · {scenario.triggerRule}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={cx('shrink-0 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scenario.meals.map((meal) => (
              <div key={meal.id}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">
                  {meal.franja}
                </p>
                <div className="flex flex-col gap-1">
                  {meal.foods.map((food, i) => (
                    <div key={i} className="flex justify-between gap-2 text-sm">
                      <span className="text-content">{food.alimento}</span>
                      <span className="shrink-0 tabular text-content-muted">{food.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <RulesCard scenario={scenario} />
        </div>
      )}
    </div>
  )
}
