import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDayPlan } from '../data/plan'
import { SESSION_META } from '../data/sessionMeta'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { mergeDay, useCustomActivities } from '../hooks/useCustomActivities'
import { RecoveryCard } from '../components/RecoveryCard'
import { AddActivityForm } from '../components/AddActivityForm'
import type { LogEntry, Session } from '../data/types'

function SessionDetailCard({ session, onDelete }: { session: Session; onDelete?: () => void }) {
  const meta = SESSION_META[session.type]
  const { getEntry, setEntry, toggleCompleted } = useTrainingLog()
  const entry = getEntry(session.id) ?? { completed: false }
  const ref = useRef<HTMLDivElement>(null)
  const { sessionId } = useParams()
  const [savedFlash, setSavedFlash] = useState(false)

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
          {session.focus && (
            <span className="inline-block mt-1.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full px-2.5 py-1">
              {session.focus}
            </span>
          )}
        </div>
      </div>

      {(session.distanceKm || session.pace || session.hrTarget) && (
        <div className="grid grid-cols-1 gap-1.5 text-sm bg-ink-100 rounded-2xl p-3">
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

      {session.targets && (
        <div>
          <p className="text-sm font-semibold text-ink-900 mb-1">Qué entrenar hoy</p>
          <ul className="text-sm text-ink-600 list-disc list-inside space-y-0.5">
            {session.targets.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {session.tips && (
        <div className="bg-ink-100 rounded-2xl p-3">
          <p className="text-sm font-semibold text-ink-900 mb-1">Para optimizar rendimiento y recuperación</p>
          <ul className="text-sm text-ink-600 list-disc list-inside space-y-0.5">
            {session.tips.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
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
          <p className="text-sm font-semibold text-brand-700 mb-0.5">Auto-regulación</p>
          <p className="text-sm text-brand-800">{session.selfRegulation}</p>
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

        {entry.completed && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-500">
              FC media (ppm)
              <input
                type="number"
                inputMode="numeric"
                value={entry.avgHr ?? ''}
                onChange={(e) => patch({ avgHr: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-500">
              Distancia real (km)
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={entry.distanceKm ?? ''}
                onChange={(e) => patch({ distanceKm: e.target.value ? Number(e.target.value) : undefined })}
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
            <button
              onClick={() => {
                setEntry(session.id, entry)
                setSavedFlash(true)
                window.setTimeout(() => setSavedFlash(false), 2000)
              }}
              className={`col-span-2 rounded-full text-sm font-semibold py-2.5 transition-colors ${
                savedFlash ? 'bg-ok-200 text-ok-700' : 'bg-ok-500 text-white'
              }`}
            >
              {savedFlash ? '✓ Guardado' : 'Guardar registro'}
            </button>
            <p className="col-span-2 text-[11px] text-ink-400 text-center -mt-1">
              Todo se guarda automáticamente en este dispositivo apenas lo escribes.
            </p>
          </div>
        )}

        {onDelete && (
          <button onClick={onDelete} className="self-start text-sm text-red-500 font-medium">
            Eliminar actividad
          </button>
        )}
      </div>
    </div>
  )
}

export function DayDetail() {
  const { date } = useParams()
  const planDay = date ? getDayPlan(date) : undefined
  const { forDate, remove } = useCustomActivities()

  const customs = date ? forDate(date) : []
  const day = useMemo(() => (planDay ? mergeDay(planDay, customs) : undefined), [planDay, customs])

  if (!day) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-500">No encontramos ese día en el plan.</p>
        <Link to="/semana" className="text-brand-500 font-semibold">
          Volver a la semana
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link to="/semana" className="text-sm text-ink-400 font-medium">
          ← Semana
        </Link>
        <p className="text-sm text-ink-500 capitalize mt-1">{day.weekday}</p>
        <h1 className="text-2xl font-bold text-ink-900">{day.date}</h1>
      </header>

      {day.note && <p className="text-sm text-brand-800 bg-brand-50 rounded-2xl p-3">{day.note}</p>}

      <div className="flex flex-col gap-4">
        {day.sessions.map((s) => (
          <SessionDetailCard
            key={s.id}
            session={s}
            onDelete={s.id.startsWith('custom-') ? () => remove(s.id) : undefined}
          />
        ))}
        {day.recovery && <RecoveryCard date={day.date} recovery={day.recovery} />}
        <AddActivityForm date={day.date} />
      </div>
    </div>
  )
}
