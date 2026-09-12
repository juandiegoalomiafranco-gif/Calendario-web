import { accountKindMeta, isDebtAccount } from '../data/categories'
import { formatMoney } from '../lib/format'
import type { AccountWithBalance } from '../lib/finanzas'

/** Fila de cuenta con su saldo. La deuda se muestra en rojo y con signo negativo. */
export function AccountCard({ account }: { account: AccountWithBalance }) {
  const meta = accountKindMeta(account.kind)
  const debt = isDebtAccount(account.kind)
  const negative = debt || account.balance < 0

  return (
    <div className="flex items-center gap-3 rounded-3xl bg-card shadow-card p-3.5">
      <div className="shrink-0 w-11 h-11 rounded-2xl bg-ink-100 flex items-center justify-center text-xl">
        <span aria-hidden>{meta.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink-900 truncate">{account.name}</p>
        <p className="text-xs text-ink-500">{meta.label}</p>
      </div>
      <p
        className={`text-base font-bold tabular-nums shrink-0 ${
          negative ? 'text-danger-400' : 'text-ink-900'
        }`}
      >
        {debt ? `−${formatMoney(Math.abs(account.balance))}` : formatMoney(account.balance)}
      </p>
    </div>
  )
}
