import type { GoodDirection } from '../data/measurements'
import { formatValue } from '../data/measurements'

interface DeltaBadgeProps {
  delta: number
  good: GoodDirection
  unit: string
  decimals?: number
  /** Umbral bajo el cual el delta se muestra como "=" (default: medio step) */
  epsilon?: number
}

// Toda la lógica de "hacia dónde es bueno moverse" vive aquí:
// peso/grasa/pliegues/cintura mejoran bajando; bíceps contraído mejora subiendo;
// cadera es estable/informativa (gris siempre).
export function DeltaBadge({ delta, good, unit, decimals = 1, epsilon = 0.25 }: DeltaBadgeProps) {
  const isFlat = Math.abs(delta) < epsilon || good === 'stable'
  const improved = good === 'down' ? delta < 0 : delta > 0
  const arrow = delta < 0 ? '▼' : '▲'

  const cls = isFlat
    ? 'bg-ink-100 text-ink-500'
    : improved
      ? 'bg-ok-100 text-ok-600'
      : 'bg-brand-50 text-brand-600'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cls}`}>
      {isFlat ? '=' : `${arrow} ${formatValue(Math.abs(delta), decimals)} ${unit}`}
    </span>
  )
}
