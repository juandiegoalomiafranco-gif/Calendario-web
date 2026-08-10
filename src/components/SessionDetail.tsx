import {
  FaceGrinning,
  FaceNeutral,
  FaceSlightlyFrowning,
  FaceSlightlySmiling,
  Goal,
  type LucideIcon,
  Volleyball,
  WavesLadder,
} from 'lucide-react'
import { activityOf } from '../data/activityMeta'
import type { FlexActivity, LogEntry, Session } from '../data/types'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { formatPace, isDistanceSession, parsePlannedDistance } from '../lib/stats'
import { timingLabel } from '../lib/schedule'
import { cx } from '../lib/cx'
import { Field, NumberInput, TextArea } from './ui/Field'

const FLEX_ACTIVITIES: { id: FlexActivity; Icon: LucideIcon; label: string }[] = [
  { id: 'futbol', Icon: Goal, label: 'Fútbol' },
  { id: 'voley', Icon: Volleyball, label: 'Vóley' },
  { id: 'natacion', Icon: WavesLadder, label: 'Natación' },
]

const FEELINGS: { id: NonNullable<LogEntry['feeling']>; Icon: LucideIcon; label: string }[] = [
  { id: 'genial', Icon: FaceGrinning, label: 'Genial' },
  { id: 'bien', Icon: FaceSlightlySmiling, label: 'Bien' },
  { id: 'regular', Icon: FaceNeutral, label: 'Regular' },
  { id: 'cargado', Icon: FaceSlightlyFrowning, label: 'Cargado' },
]

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs font-medium text-content-muted">{label}</span>
      <span className="text-sm font-semibold text-content">{value}</span>
    </div>
  )
}

/**
 * Ficha completa de una sesión: lo planeado y el registro de lo que hiciste.
 * La usan la página de día (móvil y enlaces directos) y el panel lateral del calendario.
 */
export function SessionDetail({ session }: { session: Session }) {
  const activity = activityOf(session.type)
  const { getEntry, setEntry, toggleCompleted } = useTrainingLog()
  const entry = getEntry(session.id) ?? { completed: false }
  const patch = (p: Partial<LogEntry>) => setEntry(session.id, { ...entry, ...p })
  const planned = parsePlannedDistance(session.distanceKm)
  const pace = formatPace(entry.distanceKm, entry.durationMin)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className={cx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
            activity.soft,
          )}
        >
          <activity.Icon size={20} strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-content-subtle">
            {timingLabel(session)}
          </p>
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-content">
            {session.title}
          </h3>
        </div>
      </div>

      {(session.distanceKm || session.pace || session.hrTarget) && (
        <div className="divide-y divide-line rounded-2xl bg-surface-2 px-3.5 py-1">
          {session.distanceKm && <InfoRow label="Distancia" value={`${session.distanceKm} km`} />}
          {session.pace && <InfoRow label="Ritmo" value={session.pace} />}
          {session.hrTarget && <InfoRow label="FC objetivo" value={session.hrTarget} />}
        </div>
      )}

      {session.structure && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-content">Estructura</p>
          <ul className="flex flex-col gap-1">
            {session.structure.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-content-muted">
                <span className={cx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', activity.dot)} />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.flexOptions && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-content">Opciones</p>
          <div className="flex flex-wrap gap-1.5">
            {session.flexOptions.map((opt) => (
              <span
                key={opt}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-content-muted"
              >
                {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-semibold text-content">Por qué</p>
        <p className="text-sm leading-relaxed text-content-muted">{session.why}</p>
      </div>

      {session.selfRegulation && (
        <div className="rounded-2xl bg-brand-soft p-3.5">
          <p className="mb-0.5 text-sm font-semibold text-brand">Auto-regulación</p>
          <p className="text-sm leading-relaxed text-content-muted">{session.selfRegulation}</p>
        </div>
      )}

      <hr className="border-line" />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => toggleCompleted(session.id)}
          aria-pressed={entry.completed}
          className={cx(
            'flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors',
            entry.completed
              ? 'bg-ok-soft text-ok'
              : 'bg-brand text-brand-on hover:bg-brand-strong',
          )}
        >
          {entry.completed ? '✓ Completada' : 'Marcar como completada'}
        </button>

        {entry.completed && session.type === 'flex' && (
          <Field label="¿Qué hiciste?">
            <div className="grid grid-cols-3 gap-1.5">
              {FLEX_ACTIVITIES.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => patch({ activity: id })}
                  className={cx(
                    'flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors',
                    entry.activity === id
                      ? 'bg-brand text-brand-on'
                      : 'bg-surface-2 text-content-muted hover:text-content',
                  )}
                >
                  <Icon size={15} aria-hidden /> {label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {entry.completed && isDistanceSession(session.type) && (
          <Field
            label="¿Cuántos km hiciste?"
            hint={
              entry.distanceKm == null
                ? planned > 0
                  ? `Sin dato, contaremos ~${planned} km del plan.`
                  : 'Sin dato, esta sesión suma 0 km en Progreso.'
                : undefined
            }
          >
            <NumberInput
              step="0.1"
              min="0"
              value={entry.distanceKm ?? ''}
              onChange={(e) => patch({ distanceKm: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={session.distanceKm ? `Plan: ${session.distanceKm} km` : '0.0'}
            />
          </Field>
        )}

        {entry.completed && (
          <>
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
            </div>

            {pace && (
              <p className="-mt-1 text-xs text-content-muted">
                <span className="font-semibold text-content">Ritmo:</span> {pace}
              </p>
            )}

            <Field label="FC media (ppm)">
              <NumberInput
                inputMode="numeric"
                value={entry.avgHr ?? ''}
                onChange={(e) => patch({ avgHr: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>

            <Field label="Sensación">
              <div className="grid grid-cols-4 gap-1.5">
                {FEELINGS.map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={entry.feeling === id}
                    onClick={() => patch({ feeling: entry.feeling === id ? undefined : id })}
                    className={cx(
                      'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors',
                      entry.feeling === id
                        ? 'bg-brand text-brand-on'
                        : 'bg-surface-2 text-content-muted hover:text-content',
                    )}
                  >
                    <Icon size={17} aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notas">
              <TextArea
                rows={3}
                value={entry.notes ?? ''}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Cómo te sentiste, el clima, la ruta…"
              />
            </Field>
          </>
        )}
      </div>
    </div>
  )
}
