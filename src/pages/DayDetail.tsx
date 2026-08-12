import { useEffect, useRef } from 'react'
import { ArrowLeft, Goal, PartyPopper, Volleyball, WavesLadder, type LucideIcon } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import { SESSION_META } from '../data/sessionMeta'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Field, NumberInput, Select, TextArea } from '../components/ui/Field'
import { formatPace, isDistanceSession, parsePlannedDistance } from '../lib/stats'
import { formatFull } from '../lib/dates'
import { cx } from '../lib/cx'
import type { FlexActivity, LogEntry, Session } from '../data/types'

const FLEX_ACTIVITIES: { id: FlexActivity; Icon: LucideIcon; label: string }[] = [
  { id: 'futbol', Icon: Goal, label: 'Fútbol' },
  { id: 'voley', Icon: Volleyball, label: 'Vóley' },
  { id: 'natacion', Icon: WavesLadder, label: 'Natación' },
]

const SLOT_LABEL = { AM: 'Mañana', PM: 'Tarde', ALL: 'Todo el día' } as const

function SessionDetailCard({ session }: { session: Session }) {
  const meta = SESSION_META[session.type]
  const { getEntry, setEntry, toggleCompleted } = useTrainingLog()
  const entry = getEntry(session.id) ?? { completed: false }
  const ref = useRef<HTMLDivElement>(null)
  const { sessionId } = useParams()

  useEffect(() => {
    if (sessionId === session.id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [sessionId, session.id])

  const patch = (p: Partial<LogEntry>) => setEntry(session.id, { ...entry, ...p })

  return (
    <Card ref={ref} className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className={cx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
            meta.color.soft,
          )}
        >
          <meta.Icon size={19} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
            {SLOT_LABEL[session.slot]}
          </span>
          <h3 className="text-lg font-bold tracking-tight text-content">{session.title}</h3>
        </div>
      </div>

      {(session.distanceKm || session.pace || session.hrTarget) && (
        <div className="grid grid-cols-1 gap-1.5 rounded-2xl bg-surface-2 p-3 text-sm text-content-muted sm:grid-cols-3">
          {session.distanceKm && (
            <p>
              <span className="block text-xs font-semibold text-content">Distancia</span>
              {session.distanceKm} km
            </p>
          )}
          {session.pace && (
            <p>
              <span className="block text-xs font-semibold text-content">Ritmo</span>
              {session.pace}
            </p>
          )}
          {session.hrTarget && (
            <p>
              <span className="block text-xs font-semibold text-content">FC objetivo</span>
              {session.hrTarget}
            </p>
          )}
        </div>
      )}

      {session.structure && (
        <div>
          <p className="mb-1 text-sm font-semibold text-content">Estructura</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-content-muted">
            {session.structure.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {session.flexOptions && (
        <div>
          <p className="mb-1 text-sm font-semibold text-content">Opciones</p>
          <div className="flex flex-wrap gap-1.5">
            {session.flexOptions.map((opt) => (
              <span
                key={opt}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-content"
              >
                {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-0.5 text-sm font-semibold text-content">Por qué</p>
        <p className="text-sm text-content-muted">{session.why}</p>
      </div>

      {session.selfRegulation && (
        <div className="rounded-2xl bg-accent-soft p-3">
          <p className="mb-0.5 text-sm font-semibold text-accent">Auto-regulación</p>
          <p className="text-sm text-accent">{session.selfRegulation}</p>
        </div>
      )}

      <hr className="border-line" />

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={entry.completed}
            onChange={() => toggleCompleted(session.id)}
            className="h-5 w-5 rounded accent-ok"
          />
          <span className="text-sm font-medium text-content">Marcar como completada</span>
        </label>

        {entry.completed && session.type === 'flex' && (
          <div className="flex flex-col gap-2 rounded-2xl bg-accent-soft p-3">
            <p className="text-sm font-semibold text-accent">¿Qué hiciste?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {FLEX_ACTIVITIES.map((a) => {
                const selected = entry.activity === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => patch({ activity: a.id })}
                    aria-pressed={selected}
                    className={cx(
                      'flex min-h-[44px] items-center justify-center gap-1 rounded-xl text-sm font-medium transition-colors',
                      selected
                        ? 'bg-primary text-primary-on'
                        : 'border border-line bg-surface text-content hover:bg-surface-2',
                    )}
                  >
                    <a.Icon size={15} aria-hidden /> {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {entry.completed && isDistanceSession(session.type) && (
          <div className="flex flex-col gap-1.5 rounded-2xl bg-accent-soft p-3">
            <Field label="¿Cuántos km hiciste?">
              <NumberInput
                step="0.1"
                min="0"
                value={entry.distanceKm ?? ''}
                onChange={(e) =>
                  patch({ distanceKm: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder={session.distanceKm ? `Plan: ${session.distanceKm} km` : '0.0'}
                className="bg-surface"
              />
            </Field>
            {entry.distanceKm == null && (
              <p className="text-xs text-accent">
                {parsePlannedDistance(session.distanceKm) > 0
                  ? `Sin dato, contaremos ~${parsePlannedDistance(session.distanceKm)} km del plan.`
                  : 'Sin dato, esta sesión suma 0 km en Progreso.'}
              </p>
            )}
          </div>
        )}

        {entry.completed && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (min)">
              <NumberInput
                inputMode="numeric"
                min="0"
                value={entry.durationMin ?? ''}
                onChange={(e) =>
                  patch({ durationMin: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Calorías">
              <NumberInput
                inputMode="numeric"
                min="0"
                value={entry.calories ?? ''}
                onChange={(e) =>
                  patch({ calories: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            {formatPace(entry.distanceKm, entry.durationMin) && (
              <p className="col-span-2 -mt-1 text-xs text-content-muted">
                <span className="font-semibold text-content">Ritmo:</span>{' '}
                {formatPace(entry.distanceKm, entry.durationMin)}
              </p>
            )}
            <Field label="FC media (ppm)" className="col-span-2 sm:col-span-1">
              <NumberInput
                inputMode="numeric"
                value={entry.avgHr ?? ''}
                onChange={(e) =>
                  patch({ avgHr: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Sensación" className="col-span-2 sm:col-span-1">
              <Select
                value={entry.feeling ?? ''}
                onChange={(e) =>
                  patch({ feeling: (e.target.value || undefined) as LogEntry['feeling'] })
                }
              >
                <option value="">Sin especificar</option>
                <option value="genial">Genial</option>
                <option value="bien">Bien</option>
                <option value="regular">Regular</option>
                <option value="cargado">Cargado / con molestias</option>
              </Select>
            </Field>
            <Field label="Notas" className="col-span-2">
              <TextArea
                value={entry.notes ?? ''}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={2}
              />
            </Field>
          </div>
        )}
      </div>
    </Card>
  )
}

export function DayDetail() {
  const { date } = useParams()
  const day = date ? getDayPlan(date) : undefined

  if (!day) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-content-muted">No encontramos ese día en el plan.</p>
        <Link
          to="/semana"
          className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-2 font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          <ArrowLeft size={16} aria-hidden />
          Volver a la semana
        </Link>
      </div>
    )
  }

  const holiday = holidayName(day.date)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={
          <Link
            to="/semana"
            className="inline-flex items-center gap-1.5 text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft size={15} aria-hidden />
            Semana
          </Link>
        }
        title={formatFull(day.date)}
      >
        {holiday && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <PartyPopper size={13} aria-hidden /> Festivo · {holiday}
          </span>
        )}
      </PageHeader>

      {day.note && (
        <p className="rounded-2xl bg-accent-soft p-3.5 text-sm leading-relaxed text-accent">
          {day.note}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 lg:gap-5">
        {day.sessions.map((s) => (
          <SessionDetailCard key={s.id} session={s} />
        ))}
      </div>

      {day.sessions.length === 0 && (
        <Card>
          <p className="text-sm text-content-muted">Descanso — no hay sesiones este día.</p>
        </Card>
      )}
    </div>
  )
}
