import { useId } from 'react'

interface Point {
  label: string
  value: number
}

interface TrendLineProps {
  points: Point[]
  unit?: string
  /** Color de la línea; por defecto, la marca. Acepta cualquier color CSS. */
  color?: string
  /** Decimales al mostrar cada valor sobre su punto */
  decimals?: number
  title?: string
}

const W = 320
const H = 120
const PAD_X = 18
const PAD_TOP = 26
const PAD_BOTTOM = 24

export function TrendLine({
  points,
  unit,
  color = 'rgb(var(--brand))',
  decimals = 1,
  title,
}: TrendLineProps) {
  const gradientId = useId()
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2)
  const y = (v: number) => H - PAD_BOTTOM - ((v - min) / range) * (H - PAD_TOP - PAD_BOTTOM)
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  // El área cierra la línea contra la base para el relleno degradado
  const area = `${x(0)},${H - PAD_BOTTOM} ${line} ${x(points.length - 1)},${H - PAD_BOTTOM}`
  const showEvery = points.length > 6 ? Math.ceil(points.length / 6) : 1

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-card">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={title ?? unit ?? 'Tendencia'}
      >
        {title && <title>{title}</title>}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <line
          x1={PAD_X}
          y1={H - PAD_BOTTOM}
          x2={W - PAD_X}
          y2={H - PAD_BOTTOM}
          stroke="rgb(var(--line))"
          strokeWidth={1}
        />

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={x(i)} cy={y(p.value)} r={3.5} fill={color} />
            {(i % showEvery === 0 || i === points.length - 1) && (
              <>
                <text
                  x={x(i)}
                  y={y(p.value) - 9}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="rgb(var(--text))"
                >
                  {p.value.toFixed(decimals)}
                </text>
                <text
                  x={x(i)}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgb(var(--text-subtle))"
                >
                  {p.label}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      {unit && <p className="mt-1 text-right text-[11px] text-content-subtle">{unit}</p>}
    </div>
  )
}
