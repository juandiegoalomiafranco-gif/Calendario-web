import { useMemo, useState } from 'react'

export interface TrendPoint {
  date: string // YYYY-MM-DD
  value: number
}

export interface TrendSeries {
  name: string
  color: string
  points: TrendPoint[]
}

interface TrendChartProps {
  series: TrendSeries[] // 1-2 series
  unit: string
  goal?: { value: number; label: string }
  height?: number
  formatValue?: (v: number) => string
}

const W = 320
const PAD_L = 34
const PAD_R = 14
const PAD_T = 16
const PAD_B = 22

const fmtDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function shortDate(iso: string): string {
  return fmtDate.format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
}

const defaultFormat = (v: number) => v.toFixed(1).replace('.', ',')

export function TrendChart({ series, unit, goal, height = 160, formatValue = defaultFormat }: TrendChartProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const allPoints = series.flatMap((s) => s.points)

  const { x, y, yTicks, xLabels } = useMemo(() => {
    const times = allPoints.map((p) => Date.parse(`${p.date}T00:00:00Z`))
    const values = allPoints.map((p) => p.value).concat(goal ? [goal.value] : [])
    const t0 = Math.min(...times)
    const t1 = Math.max(...times)
    let v0 = Math.min(...values)
    let v1 = Math.max(...values)
    const padV = Math.max((v1 - v0) * 0.12, 0.5)
    v0 -= padV
    v1 += padV

    const x = (iso: string) => {
      const t = Date.parse(`${iso}T00:00:00Z`)
      // X proporcional a la fecha real: el hueco feb→abr→jul debe leerse
      return t1 === t0 ? (PAD_L + (W - PAD_R)) / 2 : PAD_L + ((t - t0) / (t1 - t0)) * (W - PAD_L - PAD_R)
    }
    const y = (v: number) => PAD_T + (1 - (v - v0) / (v1 - v0)) * (height - PAD_T - PAD_B)

    const tickCount = 3
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => v0 + ((v1 - v0) * i) / tickCount)

    // Etiquetas X: fechas únicas, descartando las que quedarían encimadas (< 36 px)
    const uniqueDates = Array.from(new Set(allPoints.map((p) => p.date))).sort()
    const xLabels: string[] = []
    let lastX = -Infinity
    for (const d of uniqueDates) {
      const xd = x(d)
      if (xd - lastX >= 36) {
        xLabels.push(d)
        lastX = xd
      }
    }

    return { x, y, yTicks, xLabels }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(series), goal?.value, height])

  if (allPoints.length === 0) {
    return <p className="text-sm text-ink-400 py-6 text-center">Sin datos todavía.</p>
  }

  const selectedValues = selected
    ? series
        .map((s) => ({ name: s.name, color: s.color, point: s.points.find((p) => p.date === selected) }))
        .filter((e) => e.point)
    : []

  return (
    <div className="flex flex-col gap-2">
      {series.length > 1 && (
        <div className="flex gap-4">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`Tendencia (${unit})`}>
        {/* Gridlines recesivas */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#24262b" strokeWidth={1} />
            <text x={PAD_L - 5} y={y(v) + 3} textAnchor="end" fontSize={9} fill="#8b8e98" className="tabular-nums">
              {formatValue(v)}
            </text>
          </g>
        ))}

        {/* Línea de meta discontinua */}
        {goal && (
          <g>
            <line
              x1={PAD_L}
              y1={y(goal.value)}
              x2={W - PAD_R}
              y2={y(goal.value)}
              stroke="#8b8e98"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text x={W - PAD_R} y={y(goal.value) - 4} textAnchor="end" fontSize={9} fill="#a6aab4">
              {goal.label}
            </text>
          </g>
        )}

        {/* Series */}
        {series.map((s) => {
          if (s.points.length === 0) return null
          const sorted = [...s.points].sort((a, b) => (a.date < b.date ? -1 : 1))
          const d = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
          const last = sorted[sorted.length - 1]
          return (
            <g key={s.name}>
              {sorted.length > 1 && <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />}
              {sorted.map((p) => (
                <circle
                  key={p.date}
                  cx={x(p.date)}
                  cy={y(p.value)}
                  r={p.date === last.date ? 5 : 3.5}
                  fill={s.color}
                  stroke="#17181c"
                  strokeWidth={1.5}
                />
              ))}
              {/* Etiqueta directa solo en el último punto */}
              <text
                x={Math.min(x(last.date), W - PAD_R - 4)}
                y={y(last.value) - 9}
                textAnchor="end"
                fontSize={10}
                fontWeight={600}
                fill="#d8dade"
                className="tabular-nums"
              >
                {formatValue(last.value)}
              </text>
            </g>
          )
        })}

        {/* Etiquetas X */}
        {xLabels.map((d) => (
          <text key={d} x={x(d)} y={height - 6} textAnchor="middle" fontSize={9} fill="#8b8e98">
            {shortDate(d)}
          </text>
        ))}

        {/* Zonas de tap más grandes que el punto */}
        {Array.from(new Set(allPoints.map((p) => p.date))).map((d) => (
          <rect
            key={d}
            x={x(d) - 12}
            y={0}
            width={24}
            height={height}
            fill="transparent"
            onClick={() => setSelected((cur) => (cur === d ? null : d))}
          />
        ))}
        {selected && (
          <line x1={x(selected)} y1={PAD_T} x2={x(selected)} y2={height - PAD_B} stroke="#4a4d55" strokeWidth={1} />
        )}
      </svg>

      {/* Tooltip fijo bajo el chart (móvil: sin hover) */}
      {selected && selectedValues.length > 0 && (
        <div className="rounded-2xl bg-ink-100 px-3 py-2 text-xs text-ink-600 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-ink-800 capitalize">{shortDate(selected)}</span>
          {selectedValues.map((e) => (
            <span key={e.name} className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
              {series.length > 1 ? `${e.name}: ` : ''}
              {formatValue(e.point!.value)} {unit}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
