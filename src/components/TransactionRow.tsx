import { Link } from 'react-router-dom'
import { categoryById } from '../data/categories'
import { formatMoney } from '../lib/format'
import type { Account, Transaction } from '../data/types'

interface TransactionRowProps {
  transaction: Transaction
  accounts: Account[]
}

export function TransactionRow({ transaction: tx, accounts }: TransactionRowProps) {
  const category = categoryById(tx.category)
  const from = accounts.find((a) => a.id === tx.accountId)
  const to = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined

  const amountClass =
    tx.type === 'ingreso'
      ? 'text-ok-400'
      : tx.type === 'gasto'
        ? 'text-ink-900'
        : 'text-ink-600'
  const sign = tx.type === 'ingreso' ? '+' : tx.type === 'gasto' ? '−' : ''

  const subtitle =
    tx.type === 'transferencia'
      ? `${from?.name ?? 'Cuenta'} → ${to?.name ?? 'Cuenta'}`
      : (from?.name ?? 'Cuenta')

  return (
    <Link
      to={`/movimientos/${tx.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card shadow-card p-3 active:scale-[0.99] transition-transform"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-lg">
        <span aria-hidden>{category.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900 truncate">
          {tx.note?.trim() || category.label}
        </p>
        <p className="text-xs text-ink-500 truncate">{subtitle}</p>
      </div>
      <p className={`text-sm font-bold tabular-nums shrink-0 ${amountClass}`}>
        {sign}
        {formatMoney(tx.amount)}
      </p>
    </Link>
  )
}
