import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDayPlan } from '../data/plan'
import { holidayName } from '../data/holidays'
import { SESSION_META, SLOT_LABEL } from '../data/sessionMeta'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { formatPace, isDistanceSession, parsePlannedDistance } from '../lib/stats'
import { formatLongDate, capitalizeFirst } from '../lib/dates'
import { ArrowLeftIcon, CheckIcon } from '../components/icons'
import { HolidayBadge } from '../components/HolidayBadge'
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

  const [justSaved, setJustSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>()

  const flashSaved = useCallback(() => {
    setJustSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setJustSaved(false), 1600)
  }, [])

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current)
  }, [])

  const patch = (p: Partial<LogEntry>) => {
    setEntry(session.id, { ...entry, ...p })
    flashSaved()
  }

  const handleToggle = () => {
    toggleCompleted(session.id)
    flashSaved()
  }

  return (
    <div ref={ref} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3 scroll-mt-4">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-11 h-11 rounded-2xl ${meta.bg} ${meta.text} flex items-center justify-center text-xl`}>
          <span aria-hidden>{meta.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {SLOT_LABEL[session.slot]}
          </span>
          <h3 className="text-lg font-semibold text-ink-900">{session.title}</h3>
        </div>
        {justSaved && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-ok-300 app-page-enter">
            <CheckIcon className="w-3 h-3" /> Guardado
          </span>
        )}
      </div>

      {(session.distanceKm || session.pace || session.hrTarget) && (
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
          {session.hrTarget && (
            <p>
              <span className="font-semibold text-ink-900">FC objetivo:</span> {session.hrTarget}
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

      <div>
        <p className="text-sm font-semibold text-ink-900 mb-0.5">Por qué</p>
        <p className="text-sm text-ink-600">{session.why}</p>
      </div>

      {session.selfRegulation && (
        <div className="bg-brand-50 rounded-2xl p-3">
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
            onChange={handleToggle}
            className="w-5 h-5 rounded accent-ok-500"
          />
          <span className="text-sm font-medium text-ink-900">Marcar como completada</span>
        </label>

        {entry.completed && session.type === 'flex' && (
          <div className="bg-brand-50 rounded-2xl p-3 flex flex-col gap-2">
            <p className="text-sm font-semibold text-brand-200">¿Qué hiciste?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {FLEX_ACTIVITIES.map((a) => {
                const selected = entry.activity === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => patch({ activity: a.id })}
                    className={`min-h-[44px] rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
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
          <div className="bg-brand-50 rounded-2xl p-3 flex flex-col gap-1.5">
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
                className="rounded-xl border border-brand-500/50 bg-ink-100 px-3 py-2.5 text-base font-semibold text-ink-900"
              />
            </label>
            {entry.distanceKm == null && (
              <p className="text-xs text-brand-300">
                {parsePlannedDistance(session.distanceKm) > 0
                  ? `Sin dato, contaremos ~${parsePlannedDistance(session.distanceKm)} km del plan.`
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
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
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
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            {formatPace(entry.distanceKm, entry.durationMin) && (
              <p className="col-span-2 -mt-1 text-xs text-ink-500">
                <span className="font-semibold text-ink-900">Ritmo:</span>{' '}
                {formatPace(entry.distanceKm, entry.durationMin)}
              </p>
            )}
            <label className="col-span-2 flex flex-col gap-1 text-xs text-ink-500">
              FC media (ppm)
              <input
                type="number"
                inputMode="numeric"
                value={entry.avgHr ?? ''}
                onChange={(e) => patch({ avgHr: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs text-ink-500">
              Sensación
              <select
                value={entry.feeling ?? ''}
                onChange={(e) => patch({ feeling: (e.target.value || undefined) as LogEntry['feeling'] })}
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
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
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export function DayDetail() {
  const { date } = useParams()
  const day = date ? getDayPlan(date) : undefined

  if (!day) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-500">No encontramos ese día en el plan.</p>
        <Link
          to="/semana"
          className="inline-flex items-center gap-1.5 self-start -ml-2 min-h-[44px] px-3 rounded-full text-brand-600 font-semibold transition-colors active:bg-brand-50"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Volver a la semana
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link
          to="/semana"
          className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium transition-colors active:bg-ink-100"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Semana
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 mt-1">{capitalizeFirst(formatLongDate(day.date))}</h1>
        {holidayName(day.date) && (
          <div className="mt-2">
            <HolidayBadge name={holidayName(day.date)} />
          </div>
        )}
      </header>

      {day.note && <p className="text-sm text-brand-200 bg-brand-50 rounded-2xl p-3">{day.note}</p>}

      <div className="flex flex-col gap-4">
        {day.sessions.map((s) => (
          <SessionDetailCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  )
}
