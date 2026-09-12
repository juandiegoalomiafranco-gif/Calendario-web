import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { MoneyInput } from '../components/MoneyInput'
import { ProgressRing } from '../components/ProgressRing'
import { SaveIndicator } from '../components/SaveIndicator'
import { goalsStore, newId, useAccounts, useGoals, useTransactions } from '../hooks/useStores'
import { formatDate, todayISO } from '../lib/dates'
import { formatMoney, formatPercent } from '../lib/format'
import { goalsByUrgency } from '../lib/finanzas'
import type { Goal } from '../data/types'

interface FormState {
  name: string
  targetAmount: number
  targetDate: string
  accountId: string
  savedAmount: number
}

const EMPTY_FORM: FormState = {
  name: '',
  targetAmount: 0,
  targetDate: '',
  accountId: '',
  savedAmount: 0,
}

export function Metas() {
  const goals = useGoals()
  const accounts = useAccounts()
  const transactions = useTransactions()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const progress = useMemo(
    () => goalsByUrgency(goals, accounts, transactions),
    [goals, accounts, transactions],
  )

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts])

  function startNew() {
    setForm(EMPTY_FORM)
    setEditingId('nuevo')
    setError(null)
  }

  function startEdit(goal: Goal) {
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ?? '',
      accountId: goal.accountId ?? '',
      savedAmount: goal.savedAmount,
    })
    setEditingId(goal.id)
    setError(null)
  }

  function save() {
    if (!form.name.trim()) {
      setError('Ponle un nombre a la meta.')
      return
    }
    if (form.targetAmount <= 0) {
      setError('El monto objetivo tiene que ser mayor que cero.')
      return
    }

    const existing = goals.find((g) => g.id === editingId)
    goalsStore.save({
      id: existing?.id ?? newId(),
      name: form.name.trim(),
      targetAmount: form.targetAmount,
      targetDate: form.targetDate || undefined,
      accountId: form.accountId || undefined,
      savedAmount: form.accountId ? 0 : form.savedAmount,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
    setEditingId(null)
    setError(null)
  }

  function destroy(id: string) {
    goalsStore.remove(id)
    setEditingId(null)
  }

  if (editingId) {
    const isNew = editingId === 'nuevo'
    return (
      <div className="flex flex-col gap-4">
        <header>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
          >
            <span aria-hidden>←</span> Metas
          </button>
          <h1 className="text-2xl font-bold text-ink-900 mt-1">
            {isNew ? 'Nueva meta' : 'Editar meta'}
          </h1>
        </header>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Nombre
          <input
            type="text"
            value={form.name}
            placeholder="Ej: Fondo de emergencia"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-500">
          ¿Cuánto quieres juntar?
          <MoneyInput
            value={form.targetAmount}
            onChange={(targetAmount) => setForm({ ...form, targetAmount })}
            large
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          ¿Para cuándo? (opcional)
          <input
            type="date"
            value={form.targetDate}
            min={todayISO()}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Cuenta donde guardas esta plata (opcional)
          <select
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          >
            <option value="">Llevar el avance a mano</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-ink-500">
            Si eliges una cuenta, el avance se lee de su saldo y se actualiza solo.
          </span>
        </label>

        {!form.accountId && (
          <label className="flex flex-col gap-1.5 text-sm text-ink-500">
            ¿Cuánto llevas juntado?
            <MoneyInput
              value={form.savedAmount}
              onChange={(savedAmount) => setForm({ ...form, savedAmount })}
            />
          </label>
        )}

        {error && (
          <p className="text-sm text-danger-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          className="min-h-[52px] rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600"
        >
          {isNew ? 'Crear meta' : 'Guardar cambios'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={() => destroy(editingId)}
            className="min-h-[48px] rounded-full border border-danger-700 text-danger-400 font-medium active:bg-danger-50"
          >
            Borrar meta
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Metas</h1>
          <SaveIndicator />
        </div>
        <button
          type="button"
          onClick={startNew}
          aria-label="Nueva meta"
          className="w-12 h-12 shrink-0 rounded-full bg-brand-500 text-white shadow-card flex items-center justify-center text-2xl font-light active:bg-brand-600"
        >
          <span aria-hidden>+</span>
        </button>
      </header>

      {progress.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Sin metas todavía"
          description="Ponle nombre y monto a lo que quieres lograr — un viaje, un fondo de emergencia, un computador — y la app calcula cuánto guardar al mes."
          actionLabel="Crear mi primera meta"
          onAction={startNew}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {progress.map((p) => {
            const linked = p.goal.accountId
              ? accounts.find((a) => a.id === p.goal.accountId)
              : undefined
            return (
              <button
                key={p.goal.id}
                type="button"
                onClick={() => startEdit(p.goal)}
                className="text-left rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <ProgressRing
                    value={p.fraction * 100}
                    size={68}
                    strokeWidth={9}
                    progressColor={p.done ? '#18ba60' : p.overdue ? '#e5484d' : '#fb5a17'}
                  >
                    <span className="text-xs font-bold text-ink-900">
                      {formatPercent(p.fraction)}
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-ink-900 truncate">{p.goal.name}</p>
                    <p className="text-sm text-ink-500 tabular-nums">
                      {formatMoney(p.saved)} de {formatMoney(p.goal.targetAmount)}
                    </p>
                    {linked && (
                      <p className="text-xs text-ink-500 truncate">desde {linked.name}</p>
                    )}
                  </div>
                </div>

                {p.done ? (
                  <p className="text-sm font-semibold text-ok-400">🎉 Meta cumplida</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-ink-600 tabular-nums">
                      Faltan {formatMoney(p.remaining)}
                    </p>
                    {p.goal.targetDate && (
                      <p
                        className={`text-xs ${p.overdue ? 'text-danger-400' : 'text-ink-500'}`}
                      >
                        {p.overdue
                          ? `La fecha era el ${formatDate(p.goal.targetDate)}`
                          : `Para el ${formatDate(p.goal.targetDate)}`}
                        {p.monthlyNeeded !== null &&
                          !p.overdue &&
                          ` · ${formatMoney(p.monthlyNeeded)} al mes`}
                      </p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
