interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  /** Clases de Tailwind; el SVG pinta con los colores del sistema, no con hex sueltos. */
  trackClass?: string
  progressClass?: string
  children?: React.ReactNode
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  trackClass = 'stroke-ink-100',
  progressClass = 'stroke-brand-500',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={trackClass}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={progressClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
