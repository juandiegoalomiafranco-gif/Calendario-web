interface Bar {
  label: string
  value: number
  display?: string
}

interface WeeklyBarsProps {
  bars: Bar[]
  /** Máximo fijo para la escala (p. ej. 100 para porcentajes). Por defecto, el mayor valor. */
  max?: number
  /** Descripción accesible; si se omite se genera a partir de los datos. */
  ariaLabel?: string
}

export function WeeklyBars({ bars, max, ariaLabel }: WeeklyBarsProps) {
  const scale = max ?? Math.max(...bars.map((b) => b.value), 1)
  const desc = ariaLabel ?? bars.map((b) => `${b.label}: ${b.display ?? b.value}`).join('. ')

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex items-end gap-3 h-44" role="img" aria-label={desc}>
      {bars.map((b) => {
        const pct = scale ? (b.value / scale) * 100 : 0
        return (
          <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="text-[11px] font-semibold text-ink-600 tabular-nums">{b.display ?? String(b.value)}</span>
            <div className="w-full rounded-t-xl bg-ink-100 flex-1 flex flex-col justify-end overflow-hidden">
              <div
                className="w-full bg-brand-500 rounded-t-xl"
                style={{
                  // altura mínima para que un valor pequeño (>0) siga siendo visible
                  height: b.value > 0 ? `max(${pct}%, 4px)` : '0%',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
            <span className="text-[11px] text-ink-400">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}
