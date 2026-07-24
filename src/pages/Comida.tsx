import { useMemo, useState } from 'react'
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
import { useNutritionDay } from '../hooks/useNutritionLog'

const CODES: ScenarioCode[] = ['E1', 'E2', 'E3', 'E4']

export function Comida() {
  const iso = todayISO()
  const day = getDayPlan(iso)
  const suggested = useMemo(() => scenarioForDay(day?.sessions ?? []), [day])
  const { mealsDone, scenarioOverride, toggleMeal, setOverride } = useNutritionDay(iso)
  const [tab, setTab] = useState<'hoy' | 'escenarios' | 'reglas'>('hoy')

  const activeCode = scenarioOverride ?? suggested
  const scenario = SCENARIOS[activeCode]
  const trainingToday = (day?.sessions ?? []).filter((s) => s.type !== 'rest')

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Comida</h1>
        <p className="text-sm text-ink-500 mt-1">La dieta se ajusta a la carga del día.</p>
      </header>

      <div className="flex gap-2">
        {(['hoy', 'escenarios', 'reglas'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${
              tab === t ? 'bg-ink-900 text-white' : 'bg-card text-ink-500 shadow-card'
            }`}
          >
            {t === 'hoy' ? 'Hoy' : t}
          </button>
        ))}
      </div>

      {tab === 'hoy' && (
        <>
          <div className={`rounded-4xl ${scenario.color} text-white p-5 shadow-card`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
              {scenarioOverride ? 'Elegido por ti' : 'Sugerido por tu entreno'}
            </p>
            <p className="text-2xl font-bold font-display leading-tight mt-0.5">
              {scenario.code} · {scenario.name}
            </p>
            <p className="text-sm text-white/85 mt-1">{scenario.subtitle}</p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xl font-bold">{scenario.kcal}</p>
                <p className="text-[11px] text-white/70">kcal aprox.</p>
              </div>
              <div>
                <p className="text-xl font-bold">{scenario.carbsG} g</p>
                <p className="text-[11px] text-white/70">carbohidratos</p>
              </div>
            </div>
          </div>

          {/* Conexión entreno ↔ comida */}
          <div className="rounded-3xl bg-card shadow-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1">Por qué este escenario</p>
            <p className="text-sm text-ink-700">
              {trainingToday.length > 0
                ? `Hoy: ${trainingToday.map((s) => s.title).join(' · ')} → ${scenario.name}.`
                : `Hoy es descanso → ${scenario.name} (aquí vive el déficit).`}
            </p>
            <p className="text-[11px] text-ink-400 mt-1">Sugerencia — confírmalo con Diego.</p>
          </div>

          {/* Selector de escenario */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOverride(undefined)}
              className={`flex-1 rounded-2xl py-2 text-xs font-semibold ${
                !scenarioOverride ? 'bg-brand-500 text-white' : 'bg-card text-ink-600 shadow-card'
              }`}
            >
              Auto
            </button>
            {CODES.map((c) => (
              <button
                key={c}
                onClick={() => setOverride(c)}
                className={`flex-1 rounded-2xl py-2 text-xs font-semibold ${
                  scenarioOverride === c ? 'bg-brand-500 text-white' : 'bg-card text-ink-600 shadow-card'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {scenario.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} done={mealsDone.includes(meal.id)} onToggle={() => toggleMeal(meal.id)} />
          ))}

          <RulesCard scenario={scenario} />
        </>
      )}

      {tab === 'escenarios' && (
        <div className="flex flex-col gap-4">
          {SCENARIO_LIST.map((s) => (
            <ScenarioBlock key={s.code} scenario={s} />
          ))}
        </div>
      )}

      {tab === 'reglas' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold text-ink-900 mb-2">Reglas generales</h2>
            <ul className="flex flex-col gap-2">
              {GENERAL_RULES.map((r, i) => (
                <li key={i} className="text-sm text-ink-600 flex gap-2">
                  <span className="text-brand-500">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold text-ink-900 mb-2">Medidas caseras</h2>
            <div className="flex flex-col gap-2">
              {HOME_MEASURES.map((m) => (
                <div key={m.medida} className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-ink-800">{m.medida}</span>
                  <span className="text-ink-500 text-right">{m.equivale}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MealCard({ meal, done, onToggle }: { meal: DietMeal; done?: boolean; onToggle?: () => void }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section className={`rounded-3xl bg-card shadow-card p-4 ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink-900">{meal.franja}</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              done ? 'bg-ok-100 text-ok-700' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {done ? '✓ Hecha' : 'Marcar'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {meal.foods.map((food, i) => {
          const key = `${meal.id}-${i}`
          const isOpen = open === key
          return (
            <div key={key} className="border-b border-ink-100 last:border-0 pb-2 last:pb-0">
              <button className="w-full text-left flex justify-between gap-2" onClick={() => setOpen(isOpen ? null : key)}>
                <span className="text-sm font-medium text-ink-900">{food.alimento}</span>
                <span className="text-sm text-ink-500 shrink-0">{food.cantidad}</span>
              </button>
              <p className="text-xs text-ink-400">{food.medida}</p>
              {isOpen && food.sustitutos.length > 0 && (
                <p className="text-xs text-ink-500 mt-1">
                  <span className="font-semibold">Sustitutos: </span>
                  {food.sustitutos.join(' · ')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RulesCard({ scenario }: { scenario: DietScenario }) {
  return (
    <div className="rounded-3xl bg-ink-100 p-4 flex flex-col gap-2">
      <p className="text-sm text-ink-700">💧 {scenario.hydration}</p>
      <p className="text-sm text-ink-700">⚡ {scenario.atomix}</p>
      <p className="text-sm text-ink-700">🧪 {scenario.creatina}</p>
    </div>
  )
}

function ScenarioBlock({ scenario }: { scenario: DietScenario }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-3xl bg-card shadow-card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className={`w-full text-left ${scenario.color} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold font-display">
              {scenario.code} · {scenario.name}
            </p>
            <p className="text-xs text-white/80">
              {scenario.kcal} kcal · {scenario.carbsG} g carb · {scenario.triggerRule}
            </p>
          </div>
          <span>{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="p-4 flex flex-col gap-3">
          {scenario.meals.map((meal) => (
            <div key={meal.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1">{meal.franja}</p>
              <div className="flex flex-col gap-1">
                {meal.foods.map((food, i) => (
                  <div key={i} className="flex justify-between gap-2 text-sm">
                    <span className="text-ink-800">{food.alimento}</span>
                    <span className="text-ink-500 shrink-0">{food.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <RulesCard scenario={scenario} />
        </div>
      )}
    </div>
  )
}
