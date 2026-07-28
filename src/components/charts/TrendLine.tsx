import { useId } from 'react'

interface Point {
  label: string
  value: number
}

interface TrendLineProps {
  points: Point[]
  unit?: string
  color?: string
  /** Decimales al mostrar cada valor sobre su punto */
  decimals?: number
  /** Descripción accesible; si se omite se genera una a partir de los datos. */
  ariaLabel?: string
}

const W = 320
const H = 128
const PAD_X = 18
const PAD_TOP = 28
const PAD_BOTTOM = 26

export function TrendLine({ points, unit, color = '#fb5a17', decimals = 1, ariaLabel }: TrendLineProps) {
  const gradId = 'trend-' + useId().replace(/:/g, '')
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2)
  const y = (v: number) => H - PAD_BOTTOM - ((v - min) / range) * (H - PAD_TOP - PAD_BOTTOM)
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${PAD_X},${H - PAD_BOTTOM} ${line} ${W - PAD_X},${H - PAD_BOTTOM}`
  const showEvery = points.length > 6 ? Math.ceil(points.length / 6) : 1

  const first = points[0].value.toFixed(decimals)
  const last = points[points.length - 1].value.toFixed(decimals)
  const desc =
    ariaLabel ?? `Tendencia de ${points.length} registros, de ${first} a ${last}${unit ? ` (${unit})` : ''}.`

  return (
    <div className="rounded-3xl bg-card shadow-card p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={desc}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Gridlines recesivos: mínimo, medio y máximo */}
        {[0, 0.5, 1].map((f) => {
          const gy = H - PAD_BOTTOM - f * (H - PAD_TOP - PAD_BOTTOM)
          return <line key={f} x1={PAD_X} x2={W - PAD_X} y1={gy} y2={gy} stroke="#26272c" strokeWidth={1} />
        })}
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={x(i)} cy={y(p.value)} r={3.5} fill={color} />
            {(i % showEvery === 0 || i === points.length - 1) && (
              <>
                <text x={x(i)} y={y(p.value) - 9} textAnchor="middle" fontSize={11} fontWeight={600} fill="#c5c7cd">
                  {p.value.toFixed(decimals)}
                </text>
                <text x={x(i)} y={H - 7} textAnchor="middle" fontSize={10} fill="#8b8e98">
                  {p.label}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      {unit && <p className="text-[11px] text-ink-400 text-right mt-1">{unit}</p>}
    </div>
  )
}
