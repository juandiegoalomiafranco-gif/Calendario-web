import { useMemo, useState } from 'react'
import type { Goal, GoalSport } from '../data/types'
import { PROGRAM_START, getRange } from '../data/plan'
import { formatKm } from '../data/program'
import { useGoals, type NewGoal } from '../hooks/useGoals'
import { useTrainingLog } from '../hooks/useTrainingLog'
import { isRunning, kmForEntry } from '../lib/stats'
import { addDays, daysBetween, formatLong, todayISO } from '../lib/dates'

const SPORTS: { id: GoalSport; emoji: string; label: string }[] = [
  { id: 'running', emoji: '🏃', label: 'Running' },
  { id: 'natacion', emoji: '🏊', label: 'Natación' },
  { id: 'funcional', emoji: '🏋️', label: 'Funcional' },
]

function sportMeta(sport: GoalSport) {
  return SPORTS.find((s) => s.id === sport) ?? SPORTS[0]
}

interface FormProps {
  initial?: Goal
  onSave: (data: NewGoal) => void
  onCancel: () => void
}

function GoalForm({ initial, onSave, onCancel }: FormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [sport, setSport] = useState<GoalSport>(initial?.sport ?? 'running')
  const [targetKm, setTargetKm] = useState(initial?.targetKm != null ? String(initial.targetKm) : '')
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? addDays(todayISO(), 30))

  const km = Number(targetKm)
  const valid = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)

  return (
    <form
      className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({
          title: title.trim(),
          sport,
          targetKm: targetKm && km > 0 ? km : undefined,
          targetDate,
        })
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-ink-500">
        ¿Cuál es la meta?
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: media maratón de Bogotá"
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-ink-500">
        Deporte
        <div className="grid grid-cols-3 gap-1.5">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSport(s.id)}
              className={`min-h-[44px] rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                sport === s.id ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700 border border-ink-200'
              }`}
            >
              <span aria-hidden>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Distancia (km)
          <input
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            value={targetKm}
            onChange={(e) => setTargetKm(e.target.value)}
            placeholder="opcional"
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Fecha
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>
      </div>

      <p className="text-xs text-ink-400">
        Con distancia, el plan construye el fondo largo hacia ella y baja la carga la semana antes.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 min-h-[44px] rounded-full bg-brand-500 text-white font-semibold disabled:opacity-40"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-4 rounded-full bg-ink-100 text-ink-700 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

interface CardProps {
  goal: Goal
  todayIso: string
  longestRunKm: number
  onEdit: () => void
  onToggleAchieved: () => void
  onRemove: () => void
}

function GoalCard({ goal, todayIso, longestRunKm, onEdit, onToggleAchieved, onRemove }: CardProps) {
  const remaining = daysBetween(todayIso, goal.targetDate)
  const meta = sportMeta(goal.sport)
  const showProgress = goal.sport === 'running' && goal.targetKm != null && goal.targetKm > 0
  const pct = showProgress ? Math.min(100, (longestRunKm / goal.targetKm!) * 100) : 0

  return (
    <div className={`rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3 ${goal.achieved ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-2xl bg-ink-100 flex items-center justify-center text-xl">
          {goal.achieved ? '✅' : meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink-900">{goal.title}</h3>
          <p className="text-sm text-ink-500">{formatLong(goal.targetDate)}</p>
          {goal.targetKm != null && <p className="text-sm text-ink-500">{formatKm(goal.targetKm)} km</p>}
        </div>
        <div className="text-right shrink-0">
          {goal.achieved ? (
            <span className="text-xs font-semibold text-ok-300 bg-ok-900 rounded-full px-2 py-0.5">Lograda</span>
          ) : remaining < 0 ? (
            <span className="text-xs font-medium text-ink-400">pasó hace {-remaining} d</span>
          ) : (
            <>
              <p className="text-2xl font-bold text-brand-600">{remaining === 0 ? '¡Hoy!' : remaining}</p>
              {remaining > 0 && <p className="text-[11px] text-ink-400">{remaining === 1 ? 'día' : 'días'}</p>}
            </>
          )}
        </div>
      </div>

      {showProgress && !goal.achieved && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-ink-500">Tu fondo más largo</p>
            <p className="text-xs font-semibold text-ink-900">
              {longestRunKm.toFixed(1)} <span className="text-ink-400 font-medium">/ {formatKm(goal.targetKm!)} km</span>
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-ok-500"
              style={{ width: `${pct}%`, transition: 'width 0.3s ease' }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={onToggleAchieved}
          className="flex-1 min-h-[44px] rounded-full bg-ink-100 text-ink-700 font-medium"
        >
          {goal.achieved ? 'Marcar pendiente' : 'Marcar lograda'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[44px] px-4 rounded-full bg-ink-100 text-ink-700 font-medium"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[44px] px-4 rounded-full bg-ink-100 text-brand-400 font-medium"
          aria-label={`Borrar meta ${goal.title}`}
        >
          Borrar
        </button>
      </div>
    </div>
  )
}

export function Goals() {
  const { goals, addGoal, updateGoal, removeGoal } = useGoals()
  const { log } = useTrainingLog()
  const iso = todayISO()
  const [editing, setEditing] = useState<'new' | string | null>(null)

  // El fondo más largo que llevas corrido, para medir el avance hacia la meta.
  const longestRunKm = useMemo(() => {
    const days = getRange(PROGRAM_START, iso)
    let longest = 0
    for (const day of days) {
      for (const session of day.sessions) {
        if (!isRunning(session.type)) continue
        longest = Math.max(longest, kmForEntry(session, log[session.id]).km)
      }
    }
    return longest
  }, [log, iso])

  const pending = goals.filter((g) => !g.achieved)
  const done = goals.filter((g) => g.achieved)

  const renderGoal = (goal: Goal) =>
    editing === goal.id ? (
      <GoalForm
        key={goal.id}
        initial={goal}
        onSave={(data) => {
          updateGoal(goal.id, data)
          setEditing(null)
        }}
        onCancel={() => setEditing(null)}
      />
    ) : (
      <GoalCard
        key={goal.id}
        goal={goal}
        todayIso={iso}
        longestRunKm={longestRunKm}
        onEdit={() => setEditing(goal.id)}
        onToggleAchieved={() => updateGoal(goal.id, { achieved: !goal.achieved })}
        onRemove={() => removeGoal(goal.id)}
      />
    )

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Metas</h1>
        <p className="text-sm text-ink-500 mt-1">
          El plan se organiza alrededor de la meta más próxima: hacia ella crece el fondo largo y antes de ella baja la
          carga.
        </p>
      </header>

      {editing === 'new' ? (
        <GoalForm
          onSave={(data) => {
            addGoal(data)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="min-h-[48px] rounded-full bg-brand-500 text-white font-semibold active:scale-[0.98] transition-transform"
        >
          + Nueva meta
        </button>
      )}

      {goals.length === 0 && editing !== 'new' && (
        <p className="text-sm text-ink-500 bg-ink-100 rounded-2xl p-3">
          Todavía no tienes metas. Crea una y la app arma el plan hacia esa fecha.
        </p>
      )}

      <div className="flex flex-col gap-3">{pending.map(renderGoal)}</div>

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink-900">Logradas</h2>
          {done.map(renderGoal)}
        </section>
      )}
    </div>
  )
}
