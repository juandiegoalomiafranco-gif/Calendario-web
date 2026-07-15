import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  METRICS,
  METRIC_ORDER,
  MEASUREMENT_GOALS,
  PLIEGUES_8,
  derive,
  formatDateShort,
  formatDateLong,
  formatValue,
  metricValue,
} from '../../data/measurements'
import type { Control, DerivedKey, GoodDirection, MetricKey } from '../../data/measurements'
import { useMeasurements } from '../../hooks/useMeasurements'
import { DeltaBadge } from '../DeltaBadge'
import { TrendChart } from '../TrendChart'
import { Sparkline } from '../Sparkline'

const RED = '#f43f5e'
const BLUE = '#3b82f6'

function seriesOf(controls: Control[], metric: MetricKey | DerivedKey) {
  return controls.flatMap((c) => {
    const v = metricValue(c, metric)
    return v !== undefined ? [{ date: c.date, value: v }] : []
  })
}

function MetricRow({
  label,
  values,
  unit,
  good,
  decimals = 1,
  step = 0.5,
  goalNote,
}: {
  label: string
  values: { date: string; value: number }[]
  unit: string
  good: GoodDirection
  decimals?: number
  step?: number
  goalNote?: string
}) {
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-sm text-ink-500">{label}</span>
      <span className="flex-1">
        <Sparkline points={values.map((v) => v.value)} />
      </span>
      <span className="text-sm font-semibold text-ink-900 tabular-nums">
        {last ? `${formatValue(last.value, decimals)} ${unit}` : '—'}
      </span>
      {last && prev ? (
        <DeltaBadge delta={last.value - prev.value} good={good} unit={unit} decimals={decimals} epsilon={step / 2} />
      ) : (
        <span className="w-10" />
      )}
      {goalNote && <span className="sr-only">{goalNote}</span>}
    </div>
  )
}

const SUMMARY_METRICS: { key: MetricKey | DerivedKey; label: string; unit: string; good: GoodDirection }[] = [
  { key: 'peso', label: 'Peso', unit: 'kg', good: 'down' },
  { key: 'grasaBio', label: 'Grasa bio', unit: '%', good: 'down' },
  { key: 'yuhasz', label: '% Yuhasz', unit: '%', good: 'down' },
  { key: 'suma8', label: 'Suma 8', unit: 'mm', good: 'down' },
  { key: 'cintura', label: 'Cintura', unit: 'cm', good: 'down' },
  { key: 'imc', label: 'IMC', unit: '', good: 'stable' }, // informativo, sin color
]

export function MeasurementsTab() {
  const navigate = useNavigate()
  const { controls, removeControl, latestWith } = useMeasurements()
  const [expanded, setExpanded] = useState<string | null>(null)

  const latest = controls[controls.length - 1]
  const suma8Goal = MEASUREMENT_GOALS.find((g) => g.id === 'suma8')

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/progreso/nuevo-control"
        className="rounded-full bg-brand-500 text-white text-center font-semibold py-3.5 active:scale-[0.98] transition-transform"
      >
        ＋ Nuevo control
      </Link>

      {latest && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900">Último control</h3>
            <span className="text-xs text-ink-400 capitalize">{formatDateLong(latest.date)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {SUMMARY_METRICS.map(({ key, label, unit, good }) => {
              const v = metricValue(latest, key)
              const prev = latestWith(key, latest.id)
              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-xs text-ink-500">{label}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="text-base font-bold text-ink-900">
                      {v !== undefined ? `${formatValue(v)}${unit ? ` ${unit}` : ''}` : '—'}
                    </span>
                    {v !== undefined && prev && (
                      <DeltaBadge delta={v - prev.value} good={good} unit={unit} epsilon={0.15} />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-ink-900">Peso</h3>
        <TrendChart series={[{ name: 'Peso', color: RED, points: seriesOf(controls, 'peso') }]} unit="kg" />
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-ink-900">Grasa corporal</h3>
        <TrendChart
          series={[
            { name: 'Bioimpedancia', color: RED, points: seriesOf(controls, 'grasaBio') },
            { name: 'Yuhasz (pliegues)', color: BLUE, points: seriesOf(controls, 'yuhasz') },
          ]}
          unit="%"
        />
        <p className="text-[11px] text-ink-400">
          El % Yuhasz (calculado con 6 pliegues) es más confiable que la bioimpedancia, que tiende a sobreestimar.
        </p>
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-ink-900">Pliegues cutáneos</h3>
        <TrendChart
          series={[{ name: 'Suma 8 pliegues', color: RED, points: seriesOf(controls, 'suma8') }]}
          unit="mm"
          goal={suma8Goal ? { value: suma8Goal.target, label: `Meta < ${suma8Goal.target}` } : undefined}
        />
        <div className="divide-y divide-ink-100">
          {PLIEGUES_8.map((k) => (
            <MetricRow
              key={k}
              label={METRICS[k].shortLabel}
              values={seriesOf(controls, k)}
              unit="mm"
              good="down"
            />
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ink-900 mb-2">Perímetros</h3>
        {(['cintura', 'cadera', 'bicepsContraido'] as MetricKey[]).map((k) => (
          <MetricRow
            key={k}
            label={METRICS[k].shortLabel}
            values={seriesOf(controls, k)}
            unit="cm"
            good={METRICS[k].good}
          />
        ))}
        <p className="text-[11px] text-ink-400 mt-1.5">Meta del entrenador: bíceps contraído en 35 cm o más.</p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-ink-900">Historial de controles</h3>
        {[...controls].reverse().map((c) => {
          const d = derive(c)
          const isOpen = expanded === c.id
          const isUser = c.source === 'usuario'
          return (
            <div key={c.id} className="rounded-3xl bg-card shadow-card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900 capitalize">{formatDateShort(c.date)} {c.date.slice(0, 4)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isUser ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {isUser ? 'Tú' : '🔒 Entrenador'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5 tabular-nums">
                    {[
                      c.values.peso !== undefined ? `${formatValue(c.values.peso)} kg` : null,
                      d.yuhasz !== undefined ? `${formatValue(d.yuhasz)} % Yuhasz` : null,
                      d.suma8 !== undefined ? `Suma 8: ${formatValue(d.suma8)} mm` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Control parcial'}
                  </p>
                </div>
                <span className="text-ink-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {METRIC_ORDER.map((k) => (
                      <p key={k} className="flex justify-between gap-2 text-ink-500">
                        <span>{METRICS[k].shortLabel}</span>
                        <span className="font-medium text-ink-800 tabular-nums">
                          {c.values[k] !== undefined ? `${formatValue(c.values[k]!, METRICS[k].decimals)} ${METRICS[k].unit}` : '—'}
                        </span>
                      </p>
                    ))}
                    <p className="flex justify-between gap-2 text-ink-500 col-span-2 border-t border-ink-100 pt-1 mt-1">
                      <span>Suma 8 · Suma 6 · Yuhasz · IMC</span>
                      <span className="font-medium text-ink-800 tabular-nums">
                        {[d.suma8, d.suma6, d.yuhasz, d.imc].map((v) => (v !== undefined ? formatValue(v) : '—')).join(' · ')}
                      </span>
                    </p>
                  </div>
                  {c.notes && <p className="text-xs text-ink-500 bg-ink-100 rounded-2xl p-2.5">{c.notes}</p>}
                  {isUser && (
                    <div className="flex gap-4 pt-1">
                      <button
                        onClick={() => navigate(`/progreso/control/${c.id}/editar`)}
                        className="text-sm font-medium text-brand-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar este control? Esta acción no se puede deshacer.')) removeControl(c.id)
                        }}
                        className="text-sm font-medium text-red-500"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
