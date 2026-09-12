import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { MonthNav } from '../components/MonthNav'
import { TransactionRow } from '../components/TransactionRow'
import { useAccounts, useTransactions } from '../hooks/useStores'
import { currentMonth, formatDateLong } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { monthSummary, transactionsInMonth } from '../lib/finanzas'
import type { Transaction } from '../data/types'

type Filter = 'todos' | 'ingreso' | 'gasto' | 'transferencia'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'gasto', label: 'Gastos' },
  { id: 'ingreso', label: 'Ingresos' },
  { id: 'transferencia', label: 'Transfers' },
]

/** Agrupa por día, del más reciente al más antiguo. */
function groupByDay(transactions: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const list = groups.get(tx.date)
    if (list) list.push(tx)
    else groups.set(tx.date, [tx])
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
}

export function Movimientos() {
  const accounts = useAccounts()
  const transactions = useTransactions()
  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<Filter>('todos')
  const [accountId, setAccountId] = useState<string>('todas')

  const monthTransactions = useMemo(
    () => transactionsInMonth(transactions, month),
    [transactions, month],
  )

  const filtered = useMemo(
    () =>
      monthTransactions.filter((tx) => {
        if (filter !== 'todos' && tx.type !== filter) return false
        if (accountId !== 'todas' && tx.accountId !== accountId && tx.toAccountId !== accountId) {
          return false
        }
        return true
      }),
    [monthTransactions, filter, accountId],
  )

  const summary = useMemo(() => monthSummary(transactions, month), [transactions, month])
  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const categoryCount = useMemo(
    () => new Set(filtered.map((t) => t.category)).size,
    [filtered],
  )

  /** Total del día, con las transferencias fuera para que no distorsionen. */
  function dayTotal(items: Transaction[]): number {
    return items.reduce((sum, tx) => {
      if (tx.type === 'ingreso') return sum + tx.amount
      if (tx.type === 'gasto') return sum - tx.amount
      return sum
    }, 0)
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink-900">Movimientos</h1>
        <Link
          to="/movimientos/nuevo"
          aria-label="Anotar un movimiento"
          className="w-12 h-12 shrink-0 rounded-full bg-brand-500 text-white shadow-card flex items-center justify-center text-2xl font-light active:bg-brand-600"
        >
          <span aria-hidden>+</span>
        </Link>
      </header>

      <MonthNav month={month} onChange={setMonth} />

      <div className="rounded-3xl bg-card shadow-card p-4 flex justify-between text-center">
        <div className="flex-1">
          <p className="text-xs text-ink-500">Entró</p>
          <p className="text-base font-bold text-ok-400 tabular-nums">
            {formatMoney(summary.income)}
          </p>
        </div>
        <div className="flex-1 border-x border-ink-100">
          <p className="text-xs text-ink-500">Salió</p>
          <p className="text-base font-bold text-ink-900 tabular-nums">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-ink-500">Quedó</p>
          <p
            className={`text-base font-bold tabular-nums ${
              summary.net >= 0 ? 'text-ok-400' : 'text-danger-400'
            }`}
          >
            {formatMoney(summary.net)}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`shrink-0 min-h-[40px] px-4 rounded-full text-sm font-medium transition-colors ${
              filter === f.id ? 'bg-brand-500 text-white' : 'bg-card text-ink-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {accounts.length > 1 && (
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          Cuenta
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-sm text-ink-900"
          >
            <option value="todas">Todas las cuentas</option>
            {accounts
              .filter((a) => !a.archived)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </label>
      )}

      {groups.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title={
            monthTransactions.length === 0
              ? 'Este mes está en blanco'
              : 'Nada con ese filtro'
          }
          description={
            monthTransactions.length === 0
              ? 'Anota tus gastos e ingresos y el saldo de tus cuentas se mueve solo.'
              : 'Prueba con otro tipo de movimiento u otra cuenta.'
          }
          actionLabel={monthTransactions.length === 0 ? 'Anotar un movimiento' : undefined}
          actionTo={monthTransactions.length === 0 ? '/movimientos/nuevo' : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => {
            const total = dayTotal(g.items)
            return (
              <section key={g.date} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {formatDateLong(g.date)}
                  </h2>
                  {total !== 0 && (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        total > 0 ? 'text-ok-400' : 'text-ink-500'
                      }`}
                    >
                      {total > 0 ? '+' : '−'}
                      {formatMoney(Math.abs(total))}
                    </span>
                  )}
                </div>
                {g.items.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} accounts={accounts} />
                ))}
              </section>
            )
          })}
          <p className="text-xs text-ink-500 text-center">
            {filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'} ·{' '}
            {categoryCount} {categoryCount === 1 ? 'categoría' : 'categorías'}
          </p>
        </div>
      )}
    </div>
  )
}
