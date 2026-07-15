import type { Recovery } from '../data/types'
import { useTrainingLog } from '../hooks/useTrainingLog'

interface RecoveryCardProps {
  date: string
  recovery: Recovery
}

export function RecoveryCard({ date, recovery }: RecoveryCardProps) {
  const { getEntry, toggleCompleted } = useTrainingLog()
  const id = `${date}-foam`
  const done = getEntry(id)?.completed ?? false

  return (
    <div className="rounded-3xl bg-card shadow-card p-3 flex items-center gap-3">
      <div className="shrink-0 w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl">
        🌀
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
          {recovery.title}
        </p>
        <p className="text-xs text-ink-500 mt-0.5">{recovery.detail}</p>
      </div>
      <label className="shrink-0 p-1.5 flex items-center">
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleCompleted(id)}
          className="w-5 h-5 rounded accent-ok-500"
          aria-label="Marcar foam roller como hecho"
        />
      </label>
    </div>
  )
}
