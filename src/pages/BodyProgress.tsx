import { useEffect, useMemo, useState } from 'react'
import { todayISO } from '../data/plan'
import {
  BASELINE_CONTROL,
  COMPOSITION,
  GIRTHS,
  SKINFOLDS,
  type BodyControl,
} from '../data/bodyTypes'
import { useBodyControls, useBodyGoals } from '../hooks/useBodyProgress'
import { TrendLine } from '../components/charts/TrendLine'
import { StatCard } from '../components/StatCard'

const SEED_FLAG = 'mivida:body-seeded:v1'

function toNum(v: string): number | undefined {
  const x = parseFloat(v.replace(',', '.'))
  return Number.isNaN(x) ? undefined : x
}

function trend(controls: BodyControl[], key: keyof BodyControl) {
  return controls
    .map((c) => ({ label: `${c.date.slice(8, 10)}/${c.date.slice(5, 7)}`, value: c[key] as number | undefined }))
    .filter((p): p is { label: string; value: number } => typeof p.value === 'number')
}

export function BodyProgress() {
  const { controls, saveControl, removeControl } = useBodyControls()
  const { goals, setGoals } = useBodyGoals()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<BodyControl>>({ date: todayISO() })
  const [editingGoals, setEditingGoals] = useState(false)

  // Siembra la línea base una sola vez si no hay controles.
  useEffect(() => {
    if (controls.length === 0 && !localStorage.getItem(SEED_FLAG)) {
      localStorage.setItem(SEED_FLAG, '1')
      saveControl(BASELINE_CONTROL)
    }
  }, [controls.length, saveControl])

  const latest = controls[controls.length - 1]
  const first = controls[0]

  const setField = (key: keyof BodyControl, value: number | string | undefined) =>
    setForm((f) => ({ ...f, [key]: value }))

  function save() {
    const skinSum = SKINFOLDS.reduce((sum, s) => sum + (Number(form[s.key]) || 0), 0)
    const cintura = form.cintura
    const cadera = form.cadera
    saveControl({
      ...form,
      date: form.date ?? todayISO(),
      suma8: form.suma8 ?? (skinSum > 0 ? skinSum : undefined),
      indiceCinturaCadera:
        form.indiceCinturaCadera ?? (cintura && cadera ? Number((cintura / cadera).toFixed(2)) : undefined),
    })
    setForm({ date: todayISO() })
    setShowForm(false)
  }

  const deltas = useMemo(() => {
    if (!latest || !first || latest === first) return null
    const d = (key: keyof BodyControl) => {
      const a = first[key] as number | undefined
      const b = latest[key] as number | undefined
      return a != null && b != null ? b - a : null
    }
    return { weight: d('weightKg'), suma8: d('suma8'), fat: d('fatYuhaszPct'), cintura: d('cintura') }
  }, [latest, first])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 font-display">Progreso corporal</h1>
          <p className="text-sm text-ink-500 mt-1">Controles mensuales con Diego.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-2 active:bg-brand-600"
        >
          {showForm ? 'Cerrar' : '+ Control'}
        </button>
      </header>

      {latest && (
        <div className="flex gap-3">
          <StatCard
            label="Peso"
            value={latest.weightKg != null ? latest.weightKg.toFixed(1) : '—'}
            unit="kg"
            icon="⚖️"
            caption={deltas?.weight != null ? `${deltas.weight >= 0 ? '+' : ''}${deltas.weight.toFixed(1)} kg desde el inicio` : 'último control'}
          />
          <StatCard
            label="Suma 8 pliegues"
            value={latest.suma8 != null ? String(latest.suma8) : '—'}
            unit="mm"
            icon="📐"
            caption={deltas?.suma8 != null ? `${deltas.suma8 >= 0 ? '+' : ''}${deltas.suma8.toFixed(0)} mm` : 'menos es mejor'}
          />
        </div>
      )}
      {latest && (
        <div className="flex gap-3">
          <StatCard
            label="% grasa (Yuhasz)"
            value={latest.fatYuhaszPct != null ? latest.fatYuhaszPct.toFixed(1) : '—'}
            unit="%"
            icon="🔬"
            caption={deltas?.fat != null ? `${deltas.fat >= 0 ? '+' : ''}${deltas.fat.toFixed(1)} %` : ''}
          />
          <StatCard
            label="Cintura"
            value={latest.cintura != null ? String(latest.cintura) : '—'}
            unit="cm"
            icon="📏"
            caption={goals.targetCinturaCm ? `meta: ${goals.targetCinturaCm} cm` : ''}
          />
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-ink-500">
            Fecha del control
            <input
              type="date"
              value={form.date ?? ''}
              onChange={(e) => setField('date', e.target.value)}
              className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-base text-ink-900"
            />
          </label>

          <FieldGroup title="Composición" fields={COMPOSITION} form={form} onChange={setField} />
          <FieldGroup title="Pliegues (mm)" fields={SKINFOLDS} form={form} onChange={setField} />
          <FieldGroup title="Perímetros (cm)" fields={GIRTHS} form={form} onChange={setField} />

          <label className="flex flex-col gap-1 text-sm text-ink-500">
            Notas
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <button onClick={save} className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600">
            Guardar control
          </button>
          <p className="text-[11px] text-ink-400">La suma de 8 pliegues y el índice cintura/cadera se calculan solos si los dejas vacíos.</p>
        </div>
      )}

      {/* Metas */}
      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">🎯 Metas</p>
          <button onClick={() => setEditingGoals((v) => !v)} className="text-sm font-medium text-brand-600">
            {editingGoals ? 'Listo' : 'Editar'}
          </button>
        </div>
        {editingGoals ? (
          <div className="grid grid-cols-2 gap-3">
            <GoalInput label="Peso (kg)" value={goals.targetWeightKg} onChange={(v) => setGoals({ ...goals, targetWeightKg: v })} />
            <GoalInput label="Suma pliegues (mm)" value={goals.targetSumaPliegues} onChange={(v) => setGoals({ ...goals, targetSumaPliegues: v })} />
            <GoalInput label="Cintura (cm)" value={goals.targetCinturaCm} onChange={(v) => setGoals({ ...goals, targetCinturaCm: v })} />
            <GoalInput label="Masa magra (kg)" value={goals.targetLeanMassKg} onChange={(v) => setGoals({ ...goals, targetLeanMassKg: v })} />
          </div>
        ) : (
          <p className="text-sm text-ink-600">{goals.notes ?? 'Sin metas definidas.'}</p>
        )}
      </div>

      {/* Tendencias */}
      <TrendSection title="Peso (kg)" points={trend(controls, 'weightKg')} />
      <TrendSection title="Suma 8 pliegues (mm)" points={trend(controls, 'suma8')} color="#0ea5e9" decimals={0} />
      <TrendSection title="% grasa (Yuhasz)" points={trend(controls, 'fatYuhaszPct')} color="#10b981" />
      <TrendSection title="Cintura (cm)" points={trend(controls, 'cintura')} color="#8b5cf6" decimals={0} />

      {/* Historial */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Historial</h2>
        {[...controls].reverse().map((c) => (
          <div key={c.id} className="rounded-2xl bg-card shadow-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{c.date}</p>
              <p className="text-xs text-ink-500">
                {c.weightKg != null ? `${c.weightKg} kg` : ''}
                {c.suma8 != null ? ` · Σ8 ${c.suma8} mm` : ''}
                {c.fatYuhaszPct != null ? ` · ${c.fatYuhaszPct}% grasa` : ''}
              </p>
            </div>
            <button onClick={() => removeControl(c.id)} className="text-xs text-ink-400 active:text-brand-600">
              Borrar
            </button>
          </div>
        ))}
        {controls.length === 0 && <p className="text-sm text-ink-500">Aún no hay controles.</p>}
      </section>
    </div>
  )
}

function FieldGroup({
  title,
  fields,
  form,
  onChange,
}: {
  title: string
  fields: { key: keyof BodyControl; label: string }[]
  form: Partial<BodyControl>
  onChange: (key: keyof BodyControl, value: number | undefined) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <label key={String(f.key)} className="flex flex-col gap-1 text-xs text-ink-500">
            {f.label}
            <input
              type="number"
              inputMode="decimal"
              value={(form[f.key] as number | undefined) ?? ''}
              onChange={(e) => onChange(f.key, toNum(e.target.value))}
              className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function GoalInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-500">
      {label}
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-1.5 text-sm text-ink-900"
      />
    </label>
  )
}

function TrendSection({
  title,
  points,
  color,
  decimals,
}: {
  title: string
  points: { label: string; value: number }[]
  color?: string
  decimals?: number
}) {
  if (points.length < 2) return null
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink-900 mb-3">{title}</h2>
      <TrendLine points={points} color={color} decimals={decimals} />
    </section>
  )
}
