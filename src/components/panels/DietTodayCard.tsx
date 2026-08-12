import { Link } from 'react-router-dom'
import { ArrowUpRight, Droplets, Flame, Wheat } from 'lucide-react'
import { SCENARIOS } from '../../data/nutrition'
import { getDayPlan } from '../../data/plan'
import { scenarioForDay } from '../../lib/nutrition'
import { useNutritionDay } from '../../hooks/useNutritionLog'
import { todayIso } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

function Stat({ Icon, value, label }: { Icon: typeof Flame; value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-surface-2 p-3">
      <Icon size={15} className="text-content-subtle" aria-hidden />
      <p className="mt-1.5 text-lg font-extrabold tabular leading-none text-content">{value}</p>
      <p className="mt-1 text-[11px] text-content-muted">{label}</p>
    </div>
  )
}

/** Escenario de dieta que corresponde al entreno del día. */
export function DietTodayCard({ className }: { className?: string }) {
  const iso = todayIso()
  const day = getDayPlan(iso)
  const { scenarioOverride } = useNutritionDay(iso)
  const scenario = SCENARIOS[scenarioOverride ?? scenarioForDay(day?.sessions ?? [])]

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title="Dieta de hoy"
        action={
          <Link
            to="/comida"
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
          >
            Ver comidas
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-base font-extrabold text-white">
          {scenario.code}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-content">{scenario.name}</p>
          <p className="truncate text-xs text-content-muted">{scenario.subtitle}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Stat Icon={Flame} value={String(scenario.kcal)} label="kcal" />
        <Stat Icon={Wheat} value={`${scenario.carbsG} g`} label="carbohidratos" />
        <Stat Icon={Droplets} value={scenario.hydration.split(' ')[0]} label="hidratación" />
      </div>
    </Card>
  )
}
