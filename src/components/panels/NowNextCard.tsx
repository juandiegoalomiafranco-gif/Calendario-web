import { Link } from 'react-router-dom'
import { Clock, MapPin } from 'lucide-react'
import { useNowAndNext } from '../../hooks/useSchoolDay'
import { todayIso } from '../../lib/dates'
import { holidayName } from '../../data/holidays'
import type { ResolvedSlot } from '../../lib/school'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

function SlotRow({ slot, live }: { slot: ResolvedSlot; live?: boolean }) {
  return (
    <Link
      to={`/colegio/clase/${encodeURIComponent(slot.classCode)}`}
      className={cx(
        'flex items-center gap-3 rounded-2xl border p-3 transition-colors',
        live ? 'border-transparent ' + slot.color.soft : 'border-line hover:bg-surface-2',
      )}
    >
      <span className={cx('h-9 w-1 shrink-0 rounded-full', slot.color.dot)} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
          {live ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              En curso
            </>
          ) : (
            <span className="text-content-subtle">Sigue</span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-content">
          {slot.cls.name}
        </span>
        <span className="mt-0.5 flex items-center gap-2.5 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1 tabular">
            <Clock size={11} aria-hidden />
            {slot.start}–{slot.end}
          </span>
          {slot.room && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} aria-hidden />
              {slot.room}
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}

/** «Ahora mismo»: la clase en curso y la siguiente, con hora y salón. */
export function NowNextCard({ className }: { className?: string }) {
  const iso = todayIso()
  const { current, next, cycle } = useNowAndNext(iso, true)
  const holiday = holidayName(iso)

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title="Ahora mismo"
        action={
          cycle.cycleDay ? (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-content-muted">
              Día {cycle.cycleDay}
            </span>
          ) : undefined
        }
      />

      {!cycle.schoolDay ? (
        <p className="rounded-2xl bg-surface-2 p-3 text-sm text-content-muted">
          {holiday ? `Festivo · ${holiday}` : 'Hoy no hay colegio.'}
        </p>
      ) : !current && !next ? (
        <p className="rounded-2xl bg-surface-2 p-3 text-sm text-content-muted">
          Las clases de hoy ya terminaron.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {current && <SlotRow slot={current} live />}
          {next && <SlotRow slot={next} />}
        </div>
      )}
    </Card>
  )
}
