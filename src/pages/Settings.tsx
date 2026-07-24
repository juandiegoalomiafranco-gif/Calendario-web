import { useSettings } from '../hooks/useSettings'
import { AccountSettings } from '../components/AccountSettings'

function karvonenZone2(restingHr: number, maxHr: number): string {
  const hrr = maxHr - restingHr
  const low = Math.round(restingHr + hrr * 0.6)
  const high = Math.round(restingHr + hrr * 0.7)
  return `${low}-${high} ppm`
}

export function Settings() {
  const { settings, update } = useSettings()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Ajustes</h1>
        <p className="text-sm text-ink-500 mt-1">
          Los ritmos y zonas se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada 2-3 semanas.
        </p>
      </header>

      <AccountSettings />

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          FC en reposo (ppm)
          <input
            type="number"
            value={settings.restingHr}
            onChange={(e) => update({ restingHr: Number(e.target.value) })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-base text-ink-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          FC máxima estimada/medida (ppm)
          <input
            type="number"
            value={settings.maxHr}
            onChange={(e) => update({ maxHr: Number(e.target.value) })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-base text-ink-900"
          />
        </label>
        <div className="bg-brand-50 rounded-2xl p-3">
          <p className="text-sm font-semibold text-brand-700">Tu Zona 2 aeróbica (Karvonen)</p>
          <p className="text-lg font-bold text-brand-600">{karvonenZone2(settings.restingHr, settings.maxHr)}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Ajuste actual de ritmo (opcional)
          <textarea
            value={settings.paceNote}
            onChange={(e) => update({ paceNote: e.target.value })}
            rows={3}
            placeholder="Ej: desde la semana 3, mi rodaje suave ya sale a 7:00-7:30/km con FC en zona 2."
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
          />
        </label>
        <p className="text-xs text-ink-400">
          Este apunte es solo para ti — el plan sigue mostrando los rangos originales, pero puedes anotar aquí cómo va
          cambiando tu ritmo real a la misma FC.
        </p>
      </div>
    </div>
  )
}
