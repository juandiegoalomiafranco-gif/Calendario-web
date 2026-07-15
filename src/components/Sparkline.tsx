interface SparklineProps {
  points: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({ points, color = '#f43f5e', width = 80, height = 28 }: SparklineProps) {
  if (points.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        {points.length === 1 && <circle cx={width / 2} cy={height / 2} r={3} fill={color} />}
      </svg>
    )
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const pad = 4
  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2)
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
      <circle cx={x(points.length - 1)} cy={y(last)} r={3} fill={color} stroke="#17181c" strokeWidth={1} />
    </svg>
  )
}
