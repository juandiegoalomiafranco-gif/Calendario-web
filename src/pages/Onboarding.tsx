import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCOUNT_KINDS } from '../data/categories'
import type { AccountKind } from '../data/types'
import { accountsStore, newId } from '../hooks/useStores'
import { MoneyInput } from '../components/MoneyInput'
import { formatMoney } from '../lib/format'

interface Draft {
  key: string
  name: string
  kind: AccountKind
  balance: number
}

/** Arranque sugerido: lo más común en Colombia. El usuario borra o agrega lo que quiera. */
const SUGGESTED: Draft[] = [
  { key: 'd1', name: 'Efectivo', kind: 'efectivo', balance: 0 },
  { key: 'd2', name: 'Nequi', kind: 'nequi', balance: 0 },
  { key: 'd3', name: 'Cuenta de ahorros', kind: 'ahorro', balance: 0 },
]

/**
 * Configuración inicial: aquí el usuario mete sus saldos reales. Los montos nunca
 * pasan por el código del repo — quedan en su Supabase, detrás de su login.
 */
export function Onboarding() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Draft[]>(SUGGESTED)

  const total = drafts.reduce(
    (sum, d) => (d.kind === 'tarjeta' ? sum - Math.abs(d.balance) : sum + d.balance),
    0,
  )

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  function addDraft() {
    setDrafts((ds) => [...ds, { key: newId(), name: '', kind: 'banco', balance: 0 }])
  }

  function removeDraft(key: string) {
    setDrafts((ds) => ds.filter((d) => d.key !== key))
  }

  function finish() {
    const now = new Date().toISOString()
    for (const d of drafts) {
      const name = d.name.trim()
      if (!name) continue
      accountsStore.save({
        id: newId(),
        name,
        kind: d.kind,
        initialBalance: d.balance,
        archived: false,
        createdAt: now,
      })
    }
    navigate('/', { replace: true })
  }

  const valid = drafts.some((d) => d.name.trim())

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">¿Dónde tienes tu plata?</h1>
        <p className="text-sm text-ink-500 mt-1">
          Registra cada cuenta con lo que tiene hoy. Ese es el punto de partida: a partir de
          ahí, cada movimiento que anotes mueve el saldo solo.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {drafts.map((d) => (
          <div key={d.key} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <label className="flex-1 flex flex-col gap-1 text-xs text-ink-500">
                Nombre
                <input
                  type="text"
                  value={d.name}
                  placeholder="Ej: Bancolombia"
                  onChange={(e) => update(d.key, { name: e.target.value })}
                  className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
                />
              </label>
              <button
                type="button"
                onClick={() => removeDraft(d.key)}
                aria-label={`Quitar ${d.name || 'esta cuenta'}`}
                className="mt-5 w-11 h-11 shrink-0 rounded-xl bg-ink-100 text-ink-500 active:bg-ink-200"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-ink-500">
              Tipo
              <select
                value={d.kind}
                onChange={(e) => update(d.key, { kind: e.target.value as AccountKind })}
                className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
              >
                {ACCOUNT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.emoji} {k.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-500">
              {d.kind === 'tarjeta' ? 'Deuda actual' : 'Cuánto tiene hoy'}
              <MoneyInput value={d.balance} onChange={(balance) => update(d.key, { balance })} />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addDraft}
        className="min-h-[48px] rounded-full border border-ink-200 text-ink-700 font-medium active:bg-ink-100"
      >
        + Agregar otra cuenta
      </button>

      <div className="rounded-3xl bg-card shadow-card p-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">Patrimonio inicial</p>
        <p className="text-xl font-bold text-ink-900 tabular-nums">{formatMoney(total)}</p>
      </div>

      <button
        type="button"
        onClick={finish}
        disabled={!valid}
        className="min-h-[52px] rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600 disabled:opacity-40"
      >
        Listo, empezar
      </button>
      <p className="text-xs text-ink-500 text-center -mt-2">
        Puedes cambiar todo esto después en Ajustes.
      </p>
    </div>
  )
}
