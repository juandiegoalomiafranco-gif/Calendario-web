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
}

const W = 320
const H = 110
const PAD_X = 16
const PAD_TOP = 26
const PAD_BOTTOM = 24

export function TrendLine({ points, unit, color = '#fb5a17', decimals = 1 }: TrendLineProps) {
  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2)
  const y = (v: number) => H - PAD_BOTTOM - ((v - min) / range) * (H - PAD_TOP - PAD_BOTTOM)
  const path = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const showEvery = points.length > 6 ? Math.ceil(points.length / 6) : 1

  return (
    <div className="rounded-3xl bg-card shadow-card p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        <polyline points={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={x(i)} cy={y(p.value)} r={3.5} fill={color} />
            {(i % showEvery === 0 || i === points.length - 1) && (
              <>
                <text x={x(i)} y={y(p.value) - 9} textAnchor="middle" fontSize={11} fontWeight={600} fill="#3a3d45">
                  {p.value.toFixed(decimals)}
                </text>
                <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#9a9ea9">
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
