import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { EmptyState } from '../components/EmptyState'
import { MoneyInput } from '../components/MoneyInput'
import { categoriesFor } from '../data/categories'
import type { TxType } from '../data/types'
import { newId, transactionsStore, useAccounts, useTransactions } from '../hooks/useStores'
import { todayISO } from '../lib/dates'

const TYPES: { id: TxType; label: string; emoji: string }[] = [
  { id: 'gasto', label: 'Gasto', emoji: '⬇️' },
  { id: 'ingreso', label: 'Ingreso', emoji: '⬆️' },
  { id: 'transferencia', label: 'Transferencia', emoji: '🔁' },
]

export function MovimientoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const accounts = useAccounts()
  const transactions = useTransactions()

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts])
  const existing = id && id !== 'nuevo' ? transactions.find((t) => t.id === id) : undefined
  const isEdit = !!existing

  const [type, setType] = useState<TxType>(existing?.type ?? 'gasto')
  const [amount, setAmount] = useState(existing?.amount ?? 0)
  const [accountId, setAccountId] = useState(existing?.accountId ?? activeAccounts[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(existing?.toAccountId ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [category, setCategory] = useState(existing?.category ?? 'otros-gastos')
  const [note, setNote] = useState(existing?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  // Al cambiar de tipo, la categoría anterior puede no existir en el tipo nuevo.
  function changeType(next: TxType) {
    setType(next)
    const options = categoriesFor(next)
    if (!options.some((c) => c.id === category)) setCategory(options[0].id)
    if (next !== 'transferencia') setToAccountId('')
  }

  if (activeAccounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          emoji="🏦"
          title="Necesitas una cuenta primero"
          description="Un movimiento tiene que entrar o salir de algún lado. Crea al menos una cuenta."
          actionLabel="Crear una cuenta"
          actionTo="/ajustes"
        />
      </div>
    )
  }

  if (id && id !== 'nuevo' && !existing) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          emoji="🔍"
          title="No encontramos ese movimiento"
          description="Puede que lo hayas borrado desde otro dispositivo."
          actionLabel="Ver movimientos"
          actionTo="/movimientos"
        />
      </div>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()

    if (amount <= 0) {
      setError('Escribe un monto mayor que cero.')
      return
    }
    if (!accountId) {
      setError('Elige la cuenta del movimiento.')
      return
    }
    if (type === 'transferencia') {
      if (!toAccountId) {
        setError('Elige la cuenta de destino.')
        return
      }
      if (toAccountId === accountId) {
        setError('La cuenta de destino tiene que ser distinta de la de origen.')
        return
      }
    }

    const now = new Date().toISOString()
    transactionsStore.save({
      id: existing?.id ?? newId(),
      accountId,
      type,
      amount,
      date,
      category: type === 'transferencia' ? 'transferencia' : category,
      note: note.trim() || undefined,
      toAccountId: type === 'transferencia' ? toAccountId : undefined,
      createdAt: existing?.createdAt ?? now,
    })
    navigate('/movimientos', { replace: true })
  }

  function destroy() {
    if (!existing) return
    transactionsStore.remove(existing.id)
    navigate('/movimientos', { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <header>
        <Link
          to="/movimientos"
          className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
        >
          <span aria-hidden>←</span> Movimientos
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 mt-1">
          {isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
        </h1>
      </header>

      <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-3 gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={type === t.id}
            onClick={() => changeType(t.id)}
            className={`min-h-[52px] rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors ${
              type === t.id
                ? 'bg-brand-500 text-white'
                : 'bg-ink-100 text-ink-700 border border-ink-200'
            }`}
          >
            <span className="text-base leading-none" aria-hidden>
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-ink-500" htmlFor="monto">
        Monto
        <MoneyInput id="monto" value={amount} onChange={setAmount} large autoFocus={!isEdit} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-500">
        {type === 'transferencia' ? 'Sale de' : 'Cuenta'}
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
        >
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      {type === 'transferencia' && (
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Entra a
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          >
            <option value="">Elige una cuenta</option>
            {activeAccounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-ink-500">
        Fecha
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
        />
      </label>

      {type !== 'transferencia' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-500">Categoría</span>
          <CategoryPicker type={type} value={category} onChange={setCategory} />
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm text-ink-500">
        Nota (opcional)
        <input
          type="text"
          value={note}
          placeholder="Ej: mercado de la semana"
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
        />
      </label>

      {error && (
        <p className="text-sm text-danger-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="min-h-[52px] rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600"
      >
        {isEdit ? 'Guardar cambios' : 'Anotar movimiento'}
      </button>

      {isEdit && (
        <button
          type="button"
          onClick={destroy}
          className="min-h-[48px] rounded-full border border-danger-700 text-danger-400 font-medium active:bg-danger-50"
        >
          Borrar movimiento
        </button>
      )}
    </form>
  )
}
