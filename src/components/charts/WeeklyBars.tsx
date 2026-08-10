import { Link } from 'react-router-dom'

interface Bar {
  label: string
  value: number
  display?: string
  /** Ruta a la que lleva la barra (esa semana). */
  to?: string
  /** La semana en curso se marca: todavía no está completa. */
  inProgress?: boolean
}

interface WeeklyBarsProps {
  bars: Bar[]
  /** Máximo fijo para la escala (p. ej. 100 para porcentajes). Por defecto, el mayor valor. */
  max?: number
}

export function WeeklyBars({ bars, max }: WeeklyBarsProps) {
  const scale = max ?? Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex items-end gap-3 h-44">
      {bars.map((b) => {
        const content = (
          <>
            <span className="text-[11px] font-semibold text-ink-600">{b.display ?? String(b.value)}</span>
            <div className="w-full rounded-t-xl bg-ink-100 flex-1 flex flex-col justify-end overflow-hidden">
              <div
                className={`w-full rounded-t-xl ${b.inProgress ? 'bg-brand-500/50' : 'bg-brand-500'}`}
                style={{ height: `${scale ? (b.value / scale) * 100 : 0}%`, transition: 'height 0.3s ease' }}
              />
            </div>
            <span className="text-[11px] text-ink-400">{b.label}</span>
          </>
        )

        const className = 'flex-1 flex flex-col items-center justify-end h-full gap-1'
        return b.to ? (
          <Link key={b.label} to={b.to} className={className} title={b.inProgress ? 'Semana en curso' : undefined}>
            {content}
          </Link>
        ) : (
          <div key={b.label} className={className}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
