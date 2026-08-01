import { useSettings } from '../hooks/useSettings'
import { PRINCIPLES } from '../data/plan'

export function Settings() {
  const { settings, update } = useSettings()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Ajustes</h1>
        <p className="text-sm text-ink-500 mt-1">
          Los ritmos se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada 2-3 semanas.
        </p>
      </header>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Ajuste actual de ritmo (opcional)
          <textarea
            value={settings.paceNote}
            onChange={(e) => update({ paceNote: e.target.value })}
            rows={3}
            placeholder="Ej: desde la semana 3, mi rodaje suave ya sale a 7:00-7:30/km yendo cómodo."
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          />
        </label>
        <p className="text-xs text-ink-400">
          Este apunte es solo para ti — el plan sigue proponiendo las mismas distancias, pero puedes anotar aquí cómo va
          cambiando tu ritmo real al mismo esfuerzo.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Los principios del plan</h2>
        <ul className="flex flex-col gap-2">
          {PRINCIPLES.map((principle, i) => (
            <li key={i} className="rounded-2xl bg-card shadow-card p-3 text-sm text-ink-600 flex gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-200 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {principle}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
