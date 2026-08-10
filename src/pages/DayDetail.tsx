import { useEffect, useRef } from 'react'
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom'
import { getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import { SESSION_META } from '../data/sessionMeta'
import { HolidayBadge } from '../components/HolidayBadge'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { useGoals } from '../hooks/useGoals'
import { formatPace, isDistanceSession, plannedKmOf } from '../lib/stats'
import { addDays, formatLong } from '../lib/dates'
import type { FlexActivity, LogEntry, Session } from '../data/types'

const FLEX_ACTIVITIES: { id: FlexActivity; emoji: string; label: string }[] = [
  { id: 'futbol', emoji: '⚽', label: 'Fútbol' },
  { id: 'voley', emoji: '🏐', label: 'Vóley' },
  { id: 'natacion', emoji: '🏊', label: 'Natación' },
]

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
    <div ref={ref} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3 scroll-mt-4">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-11 h-11 rounded-2xl ${meta.bg} ${meta.text} flex items-center justify-center text-xl`}>
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {session.slot === 'AM' ? 'Mañana' : session.slot === 'PM' ? 'Tarde' : 'Todo el día'}
          </span>
          <h3 className="text-lg font-semibold text-ink-900">{session.title}</h3>
        </div>
      </div>

      {(session.distanceKm || session.pace || session.effort) && (
        <div className="grid grid-cols-1 gap-1.5 text-sm text-ink-600 bg-ink-100 rounded-2xl p-3">
          {session.distanceKm && (
            <p>
              <span className="font-semibold text-ink-900">Distancia:</span> {session.distanceKm} km
            </p>
          )}
          {session.pace && (
            <p>
              <span className="font-semibold text-ink-900">Ritmo:</span> {session.pace}
            </p>
          )}
          {session.effort && (
            <p>
              <span className="font-semibold text-ink-900">Esfuerzo:</span> {session.effort}
            </p>
          )}
        </div>
      )}

      {session.structure && (
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-1">Estructura</p>
          <ul className="text-sm text-ink-600 list-disc list-inside space-y-0.5">
            {session.structure.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {session.flexOptions && (
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-1">Opciones</p>
          <div className="flex flex-wrap gap-1.5">
            {session.flexOptions.map((opt) => (
              <span key={opt} className="text-xs font-medium bg-ink-100 text-ink-700 rounded-full px-2.5 py-1">
                {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      {session.alternative && (
        <div className="bg-ink-100 rounded-2xl p-3 flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-ink-900">Si no juegas: {session.alternative.title}</p>
          {(session.alternative.distanceKm || session.alternative.pace) && (
            <p className="text-sm text-ink-600">
              {session.alternative.distanceKm ? `${session.alternative.distanceKm} km` : ''}
              {session.alternative.distanceKm && session.alternative.pace ? ' · ' : ''}
              {session.alternative.pace ?? ''}
            </p>
          )}
          {session.alternative.structure && (
            <ul className="text-sm text-ink-600 list-disc list-inside space-y-0.5">
              {session.alternative.structure.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <p className="text-sm text-ink-500">{session.alternative.why}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-ink-900 mb-0.5">Por qué</p>
        <p className="text-sm text-ink-600">{session.why}</p>
      </div>

      {session.selfRegulation && (
        <div className="bg-brand-tint rounded-2xl p-3">
          <p className="text-sm font-semibold text-brand-300 mb-0.5">Auto-regulación</p>
          <p className="text-sm text-brand-200">{session.selfRegulation}</p>
        </div>
      )}

      <hr className="border-ink-100" />

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={entry.completed}
            onChange={() => toggleCompleted(session.id)}
            className="w-5 h-5 rounded accent-ok-500"
          />
          <span className="text-sm font-medium text-ink-900">Marcar como completada</span>
        </label>

        {entry.completed && session.type === 'flex' && (
          <div className="bg-brand-tint rounded-2xl p-3 flex flex-col gap-2">
            <p className="text-sm font-semibold text-brand-200">¿Qué hiciste?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {FLEX_ACTIVITIES.map((a) => {
                const selected = entry.activity === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => patch({ activity: a.id })}
                    className={`min-h-[44px] rounded-2xl text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                      selected ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700 border border-ink-200'
                    }`}
                  >
                    <span aria-hidden>{a.emoji}</span> {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {entry.completed && isDistanceSession(session.type) && (
          <div className="bg-brand-tint rounded-2xl p-3 flex flex-col gap-1.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-brand-200">¿Cuántos km hiciste?</span>
              <input
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                value={entry.distanceKm ?? ''}
                onChange={(e) => patch({ distanceKm: e.target.value ? Number(e.target.value) : undefined })}
                placeholder={session.distanceKm ? `Plan: ${session.distanceKm} km` : '0.0'}
                className="rounded-2xl border border-brand-500/50 bg-ink-100 px-3 py-2.5 text-base font-semibold text-ink-900"
              />
            </label>
            {entry.distanceKm == null && (
              <p className="text-xs text-brand-300">
                {plannedKmOf(session) > 0
                  ? `Sin dato, contaremos ~${plannedKmOf(session)} km del plan.`
                  : 'Sin dato, esta sesión suma 0 km en Progreso.'}
              </p>
            )}
          </div>
        )}

        {entry.completed && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-500">
              Duración (min)
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={entry.durationMin ?? ''}
                onChange={(e) => patch({ durationMin: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-2xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-500">
              Calorías
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={entry.calories ?? ''}
                onChange={(e) => patch({ calories: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-2xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            {formatPace(entry.distanceKm, entry.durationMin) && (
              <p className="col-span-2 -mt-1 text-xs text-ink-500">
                <span className="font-semibold text-ink-900">Ritmo:</span>{' '}
                {formatPace(entry.distanceKm, entry.durationMin)}
              </p>
            )}
            <label className="col-span-2 flex flex-col gap-1 text-xs text-ink-500">
              Sensación
              <select
                value={entry.feeling ?? ''}
                onChange={(e) => patch({ feeling: (e.target.value || undefined) as LogEntry['feeling'] })}
                className="rounded-2xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              >
                <option value="">Sin especificar</option>
                <option value="genial">Genial</option>
                <option value="bien">Bien</option>
                <option value="regular">Regular</option>
                <option value="cargado">Cargado / con molestias</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs text-ink-500">
              Notas
              <textarea
                value={entry.notes ?? ''}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={2}
                className="rounded-2xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

/** De dónde vino el usuario, para que el botón de volver no lo mande a otro sitio. */
const ORIGINS: Record<string, { to: string; label: string }> = {
  '/': { to: '/', label: 'Hoy' },
  '/semana': { to: '/semana', label: 'Semana' },
  '/progreso': { to: '/progreso', label: 'Progreso' },
}

export function DayDetail() {
  const { date } = useParams()
  const { state } = useLocation()
  const [params] = useSearchParams()
  const { activeGoal } = useGoals()
  const day = date ? getDayPlan(date, activeGoal) : undefined

  // El origen llega por estado de router, o por la URL cuando el enlace no puede
  // llevarlo (los puntos de las gráficas son anclas dentro de un SVG).
  const origin = (state as { from?: string } | null)?.from ?? params.get('from') ?? '/semana'
  const from = ORIGINS[origin] ?? ORIGINS['/semana']

  if (!day) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-500">No encontramos ese día en el plan.</p>
        <Link
          to={from.to}
          className="inline-flex items-center gap-1.5 self-start -ml-2 min-h-[44px] px-3 rounded-full text-brand-600 font-semibold active:bg-brand-tint"
        >
          <span aria-hidden>←</span> Volver a {from.label}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link
          to={from.to}
          className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
        >
          <span aria-hidden>←</span> {from.label}
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 mt-1">{formatLong(day.date)}</h1>
        {holidayName(day.date) && <HolidayBadge name={holidayName(day.date)!} className="mt-2" />}
      </header>

      {day.note && <p className="text-sm text-brand-200 bg-brand-tint rounded-2xl p-3">{day.note}</p>}

      <div className="flex flex-col gap-4">
        {day.sessions.map((s) => (
          <SessionDetailCard key={s.id} session={s} />
        ))}
      </div>

      <nav className="flex items-center justify-between gap-2">
        <Link
          to={`/dia/${addDays(day.date, -1)}`}
          state={{ from: from.to }}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-card shadow-card text-sm font-medium text-ink-700 active:bg-ink-100"
        >
          <span aria-hidden>←</span> Día anterior
        </Link>
        <Link
          to={`/dia/${addDays(day.date, 1)}`}
          state={{ from: from.to }}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-card shadow-card text-sm font-medium text-ink-700 active:bg-ink-100"
        >
          Día siguiente <span aria-hidden>→</span>
        </Link>
      </nav>
    </div>
  )
}
