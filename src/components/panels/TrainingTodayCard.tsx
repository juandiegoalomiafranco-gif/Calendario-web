import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Moon } from 'lucide-react'
import { getDayPlan } from '../../data/plan'
import { SESSION_META } from '../../data/sessionMeta'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { todayIso } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

/** Entreno del día con registro rápido de «hecho». */
export function TrainingTodayCard({ className }: { className?: string }) {
  const iso = todayIso()
  const day = getDayPlan(iso)
  const { getEntry, toggleCompleted } = useTrainingLog()
  const sessions = day?.sessions ?? []

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title="Entreno de hoy"
        action={
          <Link
            to="/entreno"
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
          >
            Ver plan
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        }
      />

      {sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-2 py-8 text-center">
          <Moon size={20} className="text-content-subtle" aria-hidden />
          <p className="text-sm text-content-muted">Descanso — no hay entreno hoy.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const meta = SESSION_META[s.type]
            const done = getEntry(s.id)?.completed
            const detail = [s.distanceKm && `${s.distanceKm} km`, s.pace].filter(Boolean).join(' · ')
            return (
              <div
                key={s.id}
                className={cx(
                  'flex items-center gap-3 rounded-2xl border border-line p-3',
                  done && 'opacity-60',
                )}
              >
                <span
                  className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', meta.color.soft)}
                >
                  <meta.Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
                    {s.slot === 'AM' ? 'Mañana' : s.slot === 'PM' ? 'Tarde' : 'Todo el día'}
                  </p>
                  <p className={cx('truncate text-sm font-bold text-content', done && 'line-through')}>
                    {s.title}
                  </p>
                  {detail && <p className="truncate text-xs text-content-muted">{detail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleCompleted(s.id)}
                  aria-pressed={done}
                  aria-label={done ? 'Marcar como no hecho' : 'Marcar como hecho'}
                  className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors',
                    done
                      ? 'border-transparent bg-ok text-white'
                      : 'border-line-strong text-content-subtle hover:border-ok hover:text-ok',
                  )}
                >
                  <Check size={16} strokeWidth={3} aria-hidden />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
