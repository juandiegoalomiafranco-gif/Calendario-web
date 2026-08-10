import { useSettings } from '../hooks/useSettings'
import { PRINCIPLES } from '../data/plan'
import { useSyncStatus, type SyncState } from '../lib/syncStatus'

const SYNC_META: Record<SyncState, { title: string; detail: string; className: string }> = {
  local: {
    title: 'Guardado en este dispositivo',
    detail: 'Todavía no hay sesión en la nube. Lo que registres vive aquí y se subirá cuando la haya.',
    className: 'text-ink-500',
  },
  sincronizando: {
    title: 'Sincronizando…',
    detail: 'Poniendo al día lo de este dispositivo con la nube.',
    className: 'text-ink-500',
  },
  sincronizado: {
    title: 'Sincronizado con la nube',
    detail: 'Tu registro y tus metas están respaldados.',
    className: 'text-ok-400',
  },
  'sin-conexion': {
    title: 'Sin conexión con la nube',
    detail:
      'Lo que registres se guarda en este dispositivo y se subirá solo cuando vuelva la conexión. No se pierde nada.',
    className: 'text-amber-400',
  },
}

export function Settings() {
  const { settings, update } = useSettings()
  const { state, error } = useSyncStatus()
  const sync = SYNC_META[state]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Ajustes</h1>
        <p className="text-sm text-ink-500 mt-1">
          Los ritmos se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada 2-3 semanas.
        </p>
      </header>

      <div className="rounded-3xl bg-card shadow-card p-4">
        <p className={`text-sm font-semibold ${sync.className}`}>{sync.title}</p>
        <p className="text-xs text-ink-400 mt-0.5">{sync.detail}</p>
        {error && <p className="text-[11px] text-ink-300 mt-1 break-words">({error})</p>}
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Ajuste actual de ritmo (opcional)
          <textarea
            value={settings.paceNote}
            onChange={(e) => update({ paceNote: e.target.value })}
            rows={3}
            placeholder="Ej: desde la semana 3, mi rodaje suave ya sale a 7:00-7:30/km yendo cómodo."
            className="rounded-2xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
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
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-tint text-brand-200 text-xs font-bold flex items-center justify-center">
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
