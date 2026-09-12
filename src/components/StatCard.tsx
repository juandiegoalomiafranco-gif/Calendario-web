interface StatCardProps {
  label: string
  value: string
  unit?: string
  icon?: string
  caption?: string
  /** Tinte del valor, para distinguir ingresos de gastos. */
  tone?: 'default' | 'ok' | 'danger'
}

const TONE_CLASS = {
  default: 'text-ink-900',
  ok: 'text-ok-400',
  danger: 'text-danger-400',
}

export function StatCard({ label, value, unit, icon, caption, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex-1 min-w-[8rem]">
      <div className="flex items-center gap-1.5 text-ink-500 text-sm">
        {icon && <span aria-hidden>{icon}</span>}
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-xl font-bold tabular-nums ${TONE_CLASS[tone]}`}>
        {value}
        {unit && <span className="text-sm font-medium text-ink-500 ml-1">{unit}</span>}
      </p>
      {caption && <p className="mt-0.5 text-[11px] text-ink-500 leading-snug">{caption}</p>}
    </div>
  )
}
