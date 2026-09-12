interface Bar {
  label: string
  value: number
  display?: string
}

interface WeeklyBarsProps {
  bars: Bar[]
  /** Máximo fijo para la escala (p. ej. 100 para porcentajes). Por defecto, el mayor valor. */
  max?: number
  /** Descripción para lectores de pantalla. */
  label?: string
}

export function WeeklyBars({ bars, max, label }: WeeklyBarsProps) {
  const scale = max ?? Math.max(...bars.map((b) => b.value), 1)

  return (
    <div
      className="rounded-3xl bg-card shadow-card p-4 flex items-end gap-2 h-44"
      role="img"
      aria-label={
        label ?? `Gráfica de barras: ${bars.map((b) => `${b.label} ${b.display ?? b.value}`).join(', ')}`
      }
    >
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0">
          <span className="text-[10px] font-semibold text-ink-600 tabular-nums truncate w-full text-center">
            {b.display ?? String(b.value)}
          </span>
          <div className="w-full rounded-t-lg bg-ink-100 flex-1 flex flex-col justify-end overflow-hidden">
            <div
              className="w-full bg-brand-500 rounded-t-lg"
              style={{ height: `${scale ? (b.value / scale) * 100 : 0}%`, transition: 'height 0.3s ease' }}
            />
          </div>
          <span className="text-[10px] text-ink-500 truncate w-full text-center">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
