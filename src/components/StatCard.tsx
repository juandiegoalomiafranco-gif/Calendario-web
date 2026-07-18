interface StatCardProps {
  label: string
  value: string
  unit?: string
  icon?: string
  caption?: string
}

export function StatCard({ label, value, unit, icon, caption }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex-1 min-w-[8rem]">
      <div className="flex items-center gap-1.5 text-ink-500 text-sm">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-ink-900">
        {value}
        {unit && <span className="text-sm font-medium text-ink-400 ml-1">{unit}</span>}
      </p>
      {caption && <p className="mt-0.5 text-[11px] text-ink-400 leading-snug">{caption}</p>}
    </div>
  )
}
