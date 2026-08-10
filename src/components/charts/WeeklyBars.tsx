interface Bar {
  label: string
  value: number
  display?: string
}

interface WeeklyBarsProps {
  bars: Bar[]
  /** Máximo fijo para la escala (p. ej. 100 para porcentajes). Por defecto, el mayor valor. */
  max?: number
}

export function WeeklyBars({ bars, max }: WeeklyBarsProps) {
  const scale = max ?? Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className="flex h-48 items-end gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card">
      {bars.map((b) => (
        <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[11px] font-semibold tabular text-content">
            {b.display ?? String(b.value)}
          </span>
          <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-t-xl bg-surface-2">
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-brand-strong to-brand"
              style={{
                height: `${scale ? (b.value / scale) * 100 : 0}%`,
                transition: 'height 0.3s ease',
              }}
            />
          </div>
          <span className="text-[11px] text-content-subtle">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
