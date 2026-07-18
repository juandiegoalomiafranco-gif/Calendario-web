interface Row {
  key: string
  emoji: string
  label: string
  count: number
  colorClass: string
}

export function BreakdownBars({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2.5">
          <span className="w-6 text-center text-lg" aria-hidden>
            {r.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-ink-800 truncate">{r.label}</span>
              <span className="font-semibold text-ink-900">{r.count}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className={`h-full rounded-full ${r.colorClass}`} style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
