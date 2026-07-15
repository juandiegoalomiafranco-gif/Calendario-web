import { formatValue } from '../data/measurements'

interface GoalCardProps {
  title: string
  description?: string
  unit: string
  baseline: number
  current: number
  target: number
  comparator: 'lt' | 'gte'
  currentDate?: string
  /** Delta del último control vs el anterior, para detectar tendencia en contra */
  lastDelta?: number
}

type GoalState = 'ok' | 'atencion' | 'camino'

export function GoalCard({ title, description, unit, baseline, current, target, comparator, currentDate, lastDelta }: GoalCardProps) {
  const achieved = comparator === 'lt' ? current < target : current >= target
  const wrongWay = lastDelta !== undefined && (comparator === 'lt' ? lastDelta > 0 : lastDelta < 0)
  const state: GoalState = achieved ? 'ok' : wrongWay ? 'atencion' : 'camino'

  // Progreso baseline→target, clamped 0-1
  const span = baseline - target
  const raw = span === 0 ? 1 : (baseline - current) / span
  const progress = Math.max(0, Math.min(1, comparator === 'lt' ? raw : (current - baseline) / (target - baseline || 1)))

  const missing = comparator === 'lt' ? current - target : target - current

  const pill =
    state === 'ok'
      ? { text: 'Conseguido', cls: 'bg-ok-100 text-ok-600' }
      : state === 'atencion'
        ? { text: 'Atención', cls: 'bg-brand-50 text-brand-600' }
        : { text: 'En camino', cls: 'bg-ink-100 text-ink-600' }

  const barColor = state === 'ok' ? 'bg-ok-500' : state === 'atencion' ? 'bg-brand-500' : 'bg-ink-400'

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${pill.cls}`}>{pill.text}</span>
      </div>

      <div>
        <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.round(progress * 100)}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div className="flex justify-between text-[10px] text-ink-400 mt-1 tabular-nums">
          <span>Inicio: {formatValue(baseline)}</span>
          <span>
            Meta {comparator === 'lt' ? '<' : '≥'} {formatValue(target)} {unit}
          </span>
        </div>
      </div>

      <p className="text-sm text-ink-600 tabular-nums">
        Actual: <span className="font-semibold text-ink-900">{formatValue(current)} {unit}</span>
        {currentDate && <span className="text-ink-400"> ({currentDate})</span>}
        {!achieved && missing > 0 && (
          <span className="text-ink-500"> · Faltan {formatValue(missing)} {unit}</span>
        )}
      </p>
    </div>
  )
}
