import { useState } from 'react'
import { PRINCIPLES } from '../data/plan'
import { useSettings } from '../hooks/useSettings'

function readJson(key: string, fallback: unknown): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function exportAllData(): string {
  return JSON.stringify(
    {
      exportado: new Date().toISOString(),
      registroEntrenos: readJson('calendario-web:log:v1', {}),
      actividadesPropias: readJson('calendario-web:custom:v1', []),
      medidasCorporales: readJson('calendario-web:medidas:v1', {}),
      ajustes: readJson('calendario-web:settings:v1', {}),
    },
    null,
    2,
  )
}

function karvonenZone2(restingHr: number, maxHr: number): string {
  const hrr = maxHr - restingHr
  const low = Math.round(restingHr + hrr * 0.6)
  const high = Math.round(restingHr + hrr * 0.7)
  return `${low}-${high} ppm`
}

export function Settings() {
  const { settings, update } = useSettings()
  const [copied, setCopied] = useState(false)

  const copyData = async () => {
    const text = exportAllData()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard bloqueado: compartir como archivo de texto si se puede
      if (navigator.share) await navigator.share({ title: 'Mis datos de entrenamiento', text })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Ajustes</h1>
        <p className="text-sm text-ink-500 mt-1">
          Los ritmos y zonas se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada 2-3 semanas.
        </p>
      </header>

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
          <p className="text-lg font-bold text-brand-800">{karvonenZone2(settings.restingHr, settings.maxHr)}</p>
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

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2.5">
        <h2 className="text-lg font-semibold text-ink-900">Tus datos</h2>
        <p className="text-sm text-ink-500">
          Todo tu progreso (entrenos, actividades, foam roller y medidas) se guarda solo en este dispositivo. Con este
          botón lo copias como texto para respaldarlo o pegárselo a Claude cuando quieras un análisis de cómo vas.
        </p>
        <button
          onClick={copyData}
          className={`rounded-full text-sm font-semibold py-2.5 transition-colors ${
            copied ? 'bg-ok-200 text-ok-700' : 'bg-brand-500 text-white'
          }`}
        >
          {copied ? '✓ Copiado — pégalo donde quieras' : '📋 Copiar mis datos'}
        </button>
      </div>

      <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Principios del plan</h2>
        <ul className="text-sm text-ink-600 list-disc list-inside space-y-2">
          {PRINCIPLES.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
