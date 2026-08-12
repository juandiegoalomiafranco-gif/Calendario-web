import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Trophy, X } from 'lucide-react'
import { todayISO } from '../data/plan'
import { bestByExercise, useStrength, type StrengthSet } from '../hooks/useStrength'
import { TrendLine } from '../components/charts/TrendLine'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DateInput, Field, NumberInput, Select, TextInput } from '../components/ui/Field'
import { cx } from '../lib/cx'

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

  const withSets = exerciseNames.filter((name) => sets.some((s) => s.exercise === name))

  function logSet() {
    if (!exercise) return
    const nextSetNumber = sets.filter((s) => s.exercise === exercise && s.date === date).length + 1
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
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Entreno"
        title="Levantamientos"
        description="Registra series, reps y peso. Marca solo tus PR."
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Registrar set — columna fija en escritorio */}
        <Card className="lg:sticky lg:top-[calc(4rem+1.75rem)]">
          <CardHeader title="Registrar serie" />
          <div className="flex flex-col gap-3">
            <Field label="Ejercicio">
              <Select value={exercise} onChange={(e) => setExercise(e.target.value)}>
                <option value="">Elige ejercicio…</option>
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Fecha">
              <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <div className="flex gap-3">
              <Field label="Reps" className="flex-1">
                <NumberInput
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </Field>
              <Field label="Peso (kg)" className="flex-1">
                <NumberInput value={weight} onChange={(e) => setWeight(e.target.value)} />
              </Field>
            </div>

            <Button variant="primary" size="lg" onClick={logSet} disabled={!exercise}>
              Registrar serie
            </Button>

            <div className="border-t border-line pt-3">
              <Field label="Nuevo ejercicio">
                <div className="flex gap-2">
                  <TextInput
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    placeholder="Sentadilla, press banca…"
                  />
                  <Button variant="outline" size="md" onClick={createExercise} aria-label="Añadir ejercicio">
                    <Plus size={16} aria-hidden />
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        </Card>

        {/* Ejercicios registrados */}
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-5">
          {withSets.map((name) => {
            const exSets = sets
              .filter((s) => s.exercise === name)
              .sort((a, b) => b.date.localeCompare(a.date))
            const points = progression(sets, name)
            const isOpen = expanded === name
            const pr = best.get(name)
            return (
              <Card key={name}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : name)}
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-content">{name}</p>
                    <p className="text-xs text-content-muted">
                      PR: {pr?.toFixed(1) ?? '—'} kg · {exSets.length}{' '}
                      {exSets.length === 1 ? 'serie' : 'series'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {pr != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cat-soft-amber px-2.5 py-1 text-xs font-bold tabular text-cat-amber">
                        <Trophy size={12} aria-hidden />
                        {pr.toFixed(1)} kg
                      </span>
                    )}
                    <ChevronDown
                      size={18}
                      className={cx(
                        'text-content-subtle transition-transform',
                        isOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {points.length >= 2 && (
                      <TrendLine points={points} unit="peso máx (kg) por día" decimals={1} />
                    )}
                    <div className="flex flex-col">
                      {exSets.slice(0, 12).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 border-b border-line py-1.5 text-sm last:border-0"
                        >
                          <span className="w-14 shrink-0 tabular text-xs text-content-subtle">
                            {s.date.slice(5)}
                          </span>
                          <span className="flex-1 font-medium tabular text-content">
                            {s.weightKg != null ? `${s.weightKg} kg` : '—'} × {s.reps ?? '—'}
                          </span>
                          {s.isPr && (
                            <span className="rounded-full bg-cat-soft-amber px-2 py-0.5 text-[10px] font-bold text-cat-amber">
                              PR
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSet(s.id)}
                            aria-label="Borrar serie"
                            className="text-content-subtle transition-colors hover:text-danger"
                          >
                            <X size={14} aria-hidden />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {withSets.length === 0 && (
            <Card>
              <p className="text-sm text-content-muted">
                Aún no registras levantamientos. Elige un ejercicio y registra tu primera serie.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
