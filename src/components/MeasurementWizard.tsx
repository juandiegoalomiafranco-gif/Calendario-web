import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { METRICS, METRIC_ORDER, derive, formatValue, formatDateLong } from '../data/measurements'
import type { ControlValues, MetricKey } from '../data/measurements'
import { useMeasurements } from '../hooks/useMeasurements'
import { RulerPicker } from './RulerPicker'
import { DeltaBadge } from './DeltaBadge'

interface StepDef {
  label: string
  metrics: MetricKey[]
}

const STEPS: StepDef[] = [
  { label: 'Datos básicos', metrics: ['peso', 'grasaBio'] },
  {
    label: 'Pliegues',
    metrics: ['pSubescapular', 'pTriceps', 'pBiceps', 'pSupraespinal', 'pCrestaIliaca', 'pAbdominal', 'pMuslo', 'pPantorrilla'],
  },
  { label: 'Perímetros', metrics: ['cintura', 'cadera', 'bicepsContraido'] },
  { label: 'Resumen', metrics: [] },
]

export function MeasurementWizard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { controls, addControl, updateControl, getControl, latestWith } = useMeasurements()

  const editing = id ? getControl(id) : undefined
  const isEdit = Boolean(id)

  const [step, setStep] = useState(0)
  const [date, setDate] = useState(() => editing?.date ?? new Date().toISOString().slice(0, 10))
  const [values, setValues] = useState<ControlValues>(() => ({ ...(editing?.values ?? {}) }))
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [skipped, setSkipped] = useState<Set<MetricKey>>(new Set())
  const [active, setActive] = useState<MetricKey>('pSubescapular')
  const [dirty, setDirty] = useState(false)

  // Editar solo controles del usuario; un id inválido o de seed vuelve a Medidas
  useEffect(() => {
    if (id && (!editing || editing.source !== 'usuario')) navigate('/progreso?tab=medidas', { replace: true })
  }, [id, editing, navigate])

  // Valor inicial de cada regla: tu último dato registrado, o el punto medio del rango
  const suggested = useMemo(() => {
    const out = {} as Record<MetricKey, number>
    for (const k of METRIC_ORDER) {
      const def = METRICS[k]
      const last = latestWith(k)
      out[k] = last ? last.value : Number(((def.min + def.max) / 2).toFixed(def.decimals))
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setValue = (k: MetricKey, v: number) => {
    setDirty(true)
    setSkipped((prev) => {
      if (!prev.has(k)) return prev
      const next = new Set(prev)
      next.delete(k)
      return next
    })
    setValues((prev) => ({ ...prev, [k]: v }))
  }

  const omit = (k: MetricKey) => {
    setDirty(true)
    setValues((prev) => {
      const next = { ...prev }
      delete next[k]
      return next
    })
    setSkipped((prev) => new Set(prev).add(k))
  }

  const activate = (k: MetricKey) => {
    setActive(k)
    if (values[k] === undefined && !skipped.has(k)) setValue(k, suggested[k])
  }

  // Al entrar a "Datos básicos", peso y grasa arrancan capturados (siempre visibles);
  // en pasos de chips solo se captura el chip que actives.
  useEffect(() => {
    if (step === 0) {
      for (const k of STEPS[0].metrics) {
        if (values[k] === undefined && !skipped.has(k)) setValues((prev) => ({ ...prev, [k]: suggested[k] }))
      }
    } else if (step === 1 || step === 2) {
      const metrics = STEPS[step].metrics
      const firstPending = metrics.find((m) => values[m] === undefined && !skipped.has(m))
      activate(firstPending ?? metrics[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const stepMetrics = STEPS[step].metrics
  const unresolved = stepMetrics.filter((m) => values[m] === undefined && !skipped.has(m))

  const advanceChip = () => {
    const next = stepMetrics.find((m) => m !== active && values[m] === undefined && !skipped.has(m))
    if (next) activate(next)
    else setStep((s) => s + 1)
  }

  const goBack = () => {
    if (!dirty || window.confirm('¿Descartar los cambios de este control?')) navigate('/progreso?tab=medidas')
  }

  const capturedCount = Object.keys(values).length
  const canSave = date && capturedCount > 0
  const duplicateDate = controls.some((c) => c.date === date && c.id !== id)

  const save = () => {
    if (!canSave) return
    if (isEdit && id) updateControl(id, { date, values, notes })
    else addControl({ date, values, notes })
    navigate('/progreso?tab=medidas')
  }

  const derived = derive({ id: 'draft', date, source: 'usuario', values })

  const rulerFor = (k: MetricKey) => {
    const def = METRICS[k]
    return (
      <RulerPicker
        key={k}
        value={values[k] ?? suggested[k]}
        onChange={(v) => setValue(k, v)}
        min={def.min}
        max={def.max}
        step={def.step}
        unit={def.unit}
        decimals={def.decimals}
        ariaLabel={def.label}
      />
    )
  }

  const pliegueSum = STEPS[1].metrics.reduce(
    (acc, k) => (values[k] !== undefined ? { sum: acc.sum + (values[k] as number), n: acc.n + 1 } : acc),
    { sum: 0, n: 0 },
  )

  return (
    <div className="fixed inset-0 z-50 bg-ink-50 overflow-y-auto">
      <div className="mx-auto max-w-md px-4 pt-6 pb-16 flex flex-col gap-5">
        {/* Cabecera con stepper estilo onboarding */}
        <header className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full bg-card text-ink-600 flex items-center justify-center" aria-label="Volver">
            ←
          </button>
          <div className="flex-1">
            <span className="inline-block rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink-700">
              {STEPS[step].label} · {step + 1}/{STEPS.length}
            </span>
            <div className="flex gap-1.5 mt-2">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand-500' : 'bg-ink-100'}`} />
              ))}
            </div>
          </div>
        </header>

        <h1 className="text-2xl font-bold text-ink-900">
          {isEdit ? 'Editar control' : 'Nuevo control'}
        </h1>

        {step === 0 && (
          <div className="flex flex-col gap-6">
            <label className="flex flex-col gap-1.5 text-sm text-ink-500">
              Fecha del control
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDirty(true)
                  setDate(e.target.value)
                }}
                className="rounded-xl border border-ink-200 bg-card px-3 py-2.5 text-base text-ink-900"
              />
              {duplicateDate && (
                <span className="text-xs text-brand-600">Ya hay un control con esta fecha — se guardarán los dos.</span>
              )}
            </label>

            {STEPS[0].metrics.map((k) => (
              <div key={k} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{METRICS[k].label}</p>
                  <button
                    onClick={() => omit(k)}
                    className={`text-xs font-medium ${skipped.has(k) ? 'text-brand-600' : 'text-ink-400'}`}
                  >
                    {skipped.has(k) ? 'Omitido' : 'Omitir'}
                  </button>
                </div>
                {!skipped.has(k) ? (
                  rulerFor(k)
                ) : (
                  <button onClick={() => activate(k)} className="text-sm text-ink-500 py-6">
                    Sin dato — toca para registrar
                  </button>
                )}
              </div>
            ))}

            <button onClick={() => setStep(1)} className="rounded-full bg-brand-500 text-white font-semibold py-3.5 active:scale-[0.98] transition-transform">
              Continuar
            </button>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="flex flex-col gap-4">
            {/* Chips de métricas del paso */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              {stepMetrics.map((k) => {
                const v = values[k]
                const isActive = active === k
                return (
                  <button
                    key={k}
                    onClick={() => activate(k)}
                    className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold border ${
                      isActive ? 'border-brand-500 bg-brand-50 text-ink-900' : 'border-ink-200 bg-card text-ink-600'
                    }`}
                  >
                    <span className="block">{METRICS[k].shortLabel}</span>
                    <span className={`block mt-0.5 tabular-nums ${v !== undefined ? 'text-brand-600' : 'text-ink-400'}`}>
                      {v !== undefined ? `${formatValue(v, METRICS[k].decimals)} ${METRICS[k].unit}` : '—'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{METRICS[active].label}</p>
                <button onClick={() => { omit(active); advanceChip() }} className="text-xs font-medium text-ink-400">
                  Omitir
                </button>
              </div>
              {rulerFor(active)}
            </div>

            {step === 1 && pliegueSum.n > 0 && (
              <p className="text-sm text-ink-500 text-center tabular-nums">
                Suma parcial: <span className="font-semibold text-ink-900">{formatValue(pliegueSum.sum)} mm</span> ({pliegueSum.n}/8 pliegues)
                {derived.suma8 !== undefined && (
                  <span className="block mt-0.5">
                    Suma 8: <span className="font-semibold text-ink-900">{formatValue(derived.suma8)} mm</span> · Suma 6:{' '}
                    <span className="font-semibold text-ink-900">{formatValue(derived.suma6!)} mm</span>
                  </span>
                )}
              </p>
            )}

            <button onClick={advanceChip} className="rounded-full bg-brand-500 text-white font-semibold py-3.5 active:scale-[0.98] transition-transform">
              {unresolved.filter((m) => m !== active).length > 0 ? 'Siguiente' : 'Continuar'}
            </button>
            <button onClick={() => setStep((s) => s + 1)} className="text-sm text-ink-500 font-medium">
              Saltar este paso
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2.5">
              <p className="text-sm font-semibold text-ink-900 capitalize">{formatDateLong(date)}</p>
              {METRIC_ORDER.filter((k) => values[k] !== undefined).map((k) => {
                const def = METRICS[k]
                const prev = latestWith(k, id)
                const v = values[k] as number
                return (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">{def.label}</span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="font-semibold text-ink-900">
                        {formatValue(v, def.decimals)} {def.unit}
                      </span>
                      {prev && <DeltaBadge delta={v - prev.value} good={def.good} unit={def.unit} epsilon={def.step / 2} />}
                    </span>
                  </div>
                )
              })}
              {capturedCount === 0 && <p className="text-sm text-ink-400">No registraste ningún valor todavía.</p>}
            </div>

            {(derived.suma8 !== undefined || derived.imc !== undefined) && (
              <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-ink-900">Calculados</p>
                <div className="grid grid-cols-2 gap-2 text-sm tabular-nums">
                  {derived.suma8 !== undefined && (
                    <p className="text-ink-500">Suma 8: <span className="font-semibold text-ink-900">{formatValue(derived.suma8)} mm</span></p>
                  )}
                  {derived.suma6 !== undefined && (
                    <p className="text-ink-500">Suma 6: <span className="font-semibold text-ink-900">{formatValue(derived.suma6)} mm</span></p>
                  )}
                  {derived.yuhasz !== undefined && (
                    <p className="text-ink-500">% Yuhasz: <span className="font-semibold text-ink-900">{formatValue(derived.yuhasz)} %</span></p>
                  )}
                  {derived.imc !== undefined && (
                    <p className="text-ink-500">IMC: <span className="font-semibold text-ink-900">{formatValue(derived.imc)}</span></p>
                  )}
                </div>
                <p className="text-[11px] text-ink-400">El IMC es solo informativo — a tu edad lo que guía es la composición corporal y las metas del entrenador.</p>
              </div>
            )}

            <label className="flex flex-col gap-1.5 text-sm text-ink-500">
              Notas (opcional)
              <textarea
                value={notes}
                onChange={(e) => {
                  setDirty(true)
                  setNotes(e.target.value)
                }}
                rows={2}
                placeholder="Ej: medido en ayunas, después de semana de viaje…"
                className="rounded-xl border border-ink-200 bg-card px-3 py-2 text-sm text-ink-900"
              />
            </label>

            <button
              onClick={save}
              disabled={!canSave}
              className="rounded-full bg-brand-500 text-white font-semibold py-3.5 active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              Guardar control
            </button>
            <button onClick={() => setStep(0)} className="text-sm text-ink-500 font-medium">
              Volver al inicio del formulario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
