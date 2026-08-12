import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Plus, Ruler, Scale, Target, X } from 'lucide-react'
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
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DateInput, Field, NumberInput, TextArea } from '../components/ui/Field'
import { formatDayMonth } from '../lib/dates'

const SEED_FLAG = 'mivida:body-seeded:v1'

/** Color de cada tendencia, tomado de los tokens de la paleta. */
const TREND_COLOR = {
  weight: 'rgb(var(--cat-blue))',
  suma8: 'rgb(var(--cat-violet))',
  fat: 'rgb(var(--cat-teal))',
  cintura: 'rgb(var(--cat-cyan))',
} as const

function toNum(v: string): number | undefined {
  const x = parseFloat(v.replace(',', '.'))
  return Number.isNaN(x) ? undefined : x
}

function trend(controls: BodyControl[], key: keyof BodyControl) {
  return controls
    .map((c) => ({
      label: `${c.date.slice(8, 10)}/${c.date.slice(5, 7)}`,
      value: c[key] as number | undefined,
    }))
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
        form.indiceCinturaCadera ??
        (cintura && cadera ? Number((cintura / cadera).toFixed(2)) : undefined),
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
    return {
      weight: d('weightKg'),
      suma8: d('suma8'),
      fat: d('fatYuhaszPct'),
      cintura: d('cintura'),
    }
  }, [latest, first])

  const trends = [
    { title: 'Peso (kg)', points: trend(controls, 'weightKg'), color: TREND_COLOR.weight, decimals: 1 },
    { title: 'Suma 8 pliegues (mm)', points: trend(controls, 'suma8'), color: TREND_COLOR.suma8, decimals: 0 },
    { title: '% grasa (Yuhasz)', points: trend(controls, 'fatYuhaszPct'), color: TREND_COLOR.fat, decimals: 1 },
    { title: 'Cintura (cm)', points: trend(controls, 'cintura'), color: TREND_COLOR.cintura, decimals: 0 },
  ].filter((t) => t.points.length >= 2)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Progreso corporal"
        description="Controles mensuales con Diego."
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <>
                <X size={16} aria-hidden />
                Cerrar
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden />
                Control
              </>
            )}
          </Button>
        }
      />

      {latest && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Peso"
            value={latest.weightKg != null ? latest.weightKg.toFixed(1) : '—'}
            unit="kg"
            Icon={Scale}
            tone="bg-cat-soft-blue text-cat-blue"
            caption={
              deltas?.weight != null
                ? `${deltas.weight >= 0 ? '+' : ''}${deltas.weight.toFixed(1)} kg desde el inicio`
                : 'último control'
            }
          />
          <StatCard
            label="Suma 8 pliegues"
            value={latest.suma8 != null ? String(latest.suma8) : '—'}
            unit="mm"
            Icon={Ruler}
            tone="bg-cat-soft-violet text-cat-violet"
            caption={
              deltas?.suma8 != null
                ? `${deltas.suma8 >= 0 ? '+' : ''}${deltas.suma8.toFixed(0)} mm`
                : 'menos es mejor'
            }
          />
          <StatCard
            label="% grasa (Yuhasz)"
            value={latest.fatYuhaszPct != null ? latest.fatYuhaszPct.toFixed(1) : '—'}
            unit="%"
            Icon={FlaskConical}
            tone="bg-cat-soft-teal text-cat-teal"
            caption={
              deltas?.fat != null
                ? `${deltas.fat >= 0 ? '+' : ''}${deltas.fat.toFixed(1)} %`
                : 'último control'
            }
          />
          <StatCard
            label="Cintura"
            value={latest.cintura != null ? String(latest.cintura) : '—'}
            unit="cm"
            Icon={Ruler}
            tone="bg-cat-soft-cyan text-cat-cyan"
            caption={goals.targetCinturaCm ? `meta: ${goals.targetCinturaCm} cm` : 'último control'}
          />
        </div>
      )}

      {showForm && (
        <Card padding="lg">
          <CardHeader title="Nuevo control" />
          <div className="flex flex-col gap-4">
            <Field label="Fecha del control" className="max-w-xs">
              <DateInput value={form.date ?? ''} onChange={(e) => setField('date', e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <FieldGroup title="Composición" fields={COMPOSITION} form={form} onChange={setField} />
              <FieldGroup title="Pliegues (mm)" fields={SKINFOLDS} form={form} onChange={setField} />
              <FieldGroup title="Perímetros (cm)" fields={GIRTHS} form={form} onChange={setField} />
            </div>

            <Field
              label="Notas"
              hint="La suma de 8 pliegues y el índice cintura/cadera se calculan solos si los dejas vacíos."
            >
              <TextArea
                value={form.notes ?? ''}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
              />
            </Field>

            <Button variant="primary" size="lg" onClick={save} className="self-start">
              Guardar control
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Metas"
            icon={<Target size={16} className="text-content-subtle" aria-hidden />}
            action={
              <Button size="sm" variant="ghost" onClick={() => setEditingGoals((v) => !v)}>
                {editingGoals ? 'Listo' : 'Editar'}
              </Button>
            }
          />
          {editingGoals ? (
            <div className="grid grid-cols-2 gap-3">
              <GoalInput
                label="Peso (kg)"
                value={goals.targetWeightKg}
                onChange={(v) => setGoals({ ...goals, targetWeightKg: v })}
              />
              <GoalInput
                label="Suma pliegues (mm)"
                value={goals.targetSumaPliegues}
                onChange={(v) => setGoals({ ...goals, targetSumaPliegues: v })}
              />
              <GoalInput
                label="Cintura (cm)"
                value={goals.targetCinturaCm}
                onChange={(v) => setGoals({ ...goals, targetCinturaCm: v })}
              />
              <GoalInput
                label="Masa magra (kg)"
                value={goals.targetLeanMassKg}
                onChange={(v) => setGoals({ ...goals, targetLeanMassKg: v })}
              />
            </div>
          ) : (
            <GoalsSummary goals={goals} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Historial"
            action={
              <span className="text-xs text-content-subtle">
                {controls.length} {controls.length === 1 ? 'control' : 'controles'}
              </span>
            }
          />
          {controls.length > 0 ? (
            <div className="flex flex-col">
              {[...controls].reverse().map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-content">{formatDayMonth(c.date)}</p>
                    <p className="truncate text-xs tabular text-content-muted">
                      {c.weightKg != null ? `${c.weightKg} kg` : ''}
                      {c.suma8 != null ? ` · Σ8 ${c.suma8} mm` : ''}
                      {c.fatYuhaszPct != null ? ` · ${c.fatYuhaszPct}% grasa` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeControl(c.id)}
                    aria-label={`Borrar control del ${c.date}`}
                    className="shrink-0 text-content-subtle transition-colors hover:text-danger"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-muted">Aún no hay controles.</p>
          )}
        </Card>
      </div>

      {trends.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          {trends.map((t) => (
            <Card key={t.title}>
              <CardHeader title={t.title} />
              <TrendLine points={t.points} color={t.color} decimals={t.decimals} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/** Resumen de metas cuando no se están editando. */
function GoalsSummary({ goals }: { goals: ReturnType<typeof useBodyGoals>['goals'] }) {
  const rows = [
    { label: 'Peso', value: goals.targetWeightKg, unit: 'kg' },
    { label: 'Suma pliegues', value: goals.targetSumaPliegues, unit: 'mm' },
    { label: 'Cintura', value: goals.targetCinturaCm, unit: 'cm' },
    { label: 'Masa magra', value: goals.targetLeanMassKg, unit: 'kg' },
  ].filter((r) => r.value != null)

  if (rows.length === 0) {
    return <p className="text-sm text-content-muted">{goals.notes ?? 'Sin metas definidas.'}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3 text-sm">
          <span className="text-content-muted">{r.label}</span>
          <span className="font-semibold tabular text-content">
            {r.value} {r.unit}
          </span>
        </div>
      ))}
      {goals.notes && <p className="mt-1 text-xs text-content-subtle">{goals.notes}</p>}
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
    <div className="rounded-2xl bg-surface-2 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <label key={String(f.key)} className="flex flex-col gap-1 text-xs text-content-muted">
            {f.label}
            <NumberInput
              value={(form[f.key] as number | undefined) ?? ''}
              onChange={(e) => onChange(f.key, toNum(e.target.value))}
              className="bg-surface px-2.5 py-1.5 text-sm"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function GoalInput({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-content-muted">
      {label}
      <NumberInput
        value={value ?? ''}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="px-2.5 py-1.5 text-sm"
      />
    </label>
  )
}
