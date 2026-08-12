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
    <div className="rounded-3xl border border-line bg-surface shadow-card p-4 flex items-end gap-3 h-44">
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <span className="text-[11px] font-bold tabular text-content">{b.display ?? String(b.value)}</span>
          <div className="w-full rounded-t-xl bg-surface-2 flex-1 flex flex-col justify-end overflow-hidden">
            <div
              className="w-full rounded-t-xl bg-primary"
              style={{ height: `${scale ? (b.value / scale) * 100 : 0}%`, transition: 'height 0.3s ease' }}
            />
          </div>
          <span className="text-[11px] text-content-subtle">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
