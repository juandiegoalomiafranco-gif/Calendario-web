import { useMemo, useState } from 'react'
import { todayISO } from '../data/plan'
import { bestByExercise, useStrength, type StrengthSet } from '../hooks/useStrength'
import { TrendLine } from '../components/charts/TrendLine'

function toNum(v: string): number | undefined {
  const x = parseFloat(v.replace(',', '.'))
  return Number.isNaN(x) ? undefined : x
}

/** Máximo peso por fecha para un ejercicio → puntos de progresión. */
function progression(sets: StrengthSet[], exercise: string) {
  const byDate = new Map<string, number>()
  for (const s of sets) {
    if (s.exercise !== exercise || s.weightKg == null) continue
    byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, s.weightKg))
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ label: `${date.slice(8, 10)}/${date.slice(5, 7)}`, value }))
}

export function Strength() {
  const { sets, exercises, addSet, removeSet, addExercise } = useStrength()
  const [exercise, setExercise] = useState('')
  const [newExercise, setNewExercise] = useState('')
  const [date, setDate] = useState(todayISO())
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const best = useMemo(() => bestByExercise(sets), [sets])
  const exerciseNames = useMemo(() => {
    const fromSets = new Set(sets.map((s) => s.exercise))
    for (const e of exercises) fromSets.add(e.name)
    return [...fromSets].sort()
  }, [sets, exercises])

  function logSet() {
    if (!exercise) return
    const nextSetNumber =
      sets.filter((s) => s.exercise === exercise && s.date === date).length + 1
    addSet({ exercise, date, reps: toNum(reps), weightKg: toNum(weight), setNumber: nextSetNumber })
    setReps('')
    setWeight('')
  }

  function createExercise() {
    const name = newExercise.trim()
    if (!name) return
    addExercise(name)
    setExercise(name)
    setNewExercise('')
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Levantamientos</h1>
        <p className="text-sm text-ink-500 mt-1">Registra series, reps y peso. Marca solo tus PR.</p>
      </header>

      {/* Registrar set */}
      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="flex-1 rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          >
            <option value="">Elige ejercicio…</option>
            {exerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-2 py-2 text-sm text-ink-900"
          />
        </div>

        <div className="flex gap-2">
          <input
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            placeholder="Nuevo ejercicio (sentadilla…)"
            className="flex-1 rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          />
          <button onClick={createExercise} className="rounded-xl bg-ink-100 px-3 text-sm font-medium text-ink-700 active:bg-ink-200">
            Añadir
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <label className="flex-1 flex flex-col gap-1 text-xs text-ink-500">
            Reps
            <input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900" />
          </label>
          <label className="flex-1 flex flex-col gap-1 text-xs text-ink-500">
            Peso (kg)
            <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900" />
          </label>
          <button onClick={logSet} className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-2 active:bg-brand-600">
            Registrar
          </button>
        </div>
      </div>

      {/* Por ejercicio */}
      {exerciseNames.filter((name) => sets.some((s) => s.exercise === name)).map((name) => {
        const exSets = sets.filter((s) => s.exercise === name).sort((a, b) => b.date.localeCompare(a.date))
        const points = progression(sets, name)
        const isOpen = expanded === name
        return (
          <section key={name} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
            <button className="flex items-center justify-between" onClick={() => setExpanded(isOpen ? null : name)}>
              <div className="text-left">
                <p className="text-base font-semibold text-ink-900">{name}</p>
                <p className="text-xs text-ink-500">
                  PR: {best.get(name)?.toFixed(1) ?? '—'} kg · {exSets.length} sets
                </p>
              </div>
              <span className="text-ink-400">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <>
                {points.length >= 2 && <TrendLine points={points} unit="peso máx (kg) por día" decimals={1} />}
                <div className="flex flex-col gap-1.5">
                  {exSets.slice(0, 12).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="text-ink-400 text-xs w-14">{s.date.slice(5)}</span>
                      <span className="text-ink-900 font-medium flex-1">
                        {s.weightKg != null ? `${s.weightKg} kg` : '—'} × {s.reps ?? '—'}
                      </span>
                      {s.isPr && <span className="text-[10px] font-bold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5">PR</span>}
                      <button onClick={() => removeSet(s.id)} className="text-xs text-ink-300 active:text-brand-600">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )
      })}

      {sets.length === 0 && <p className="text-sm text-ink-500">Aún no registras levantamientos.</p>}
    </div>
  )
}
