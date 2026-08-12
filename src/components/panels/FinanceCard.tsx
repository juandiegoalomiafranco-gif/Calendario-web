import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react'
import { useFinance } from '../../hooks/useFinance'
import { formatCOP, monthKey } from '../../lib/finance'
import { todayIso } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

/** Balance total y movimientos del mes en curso. */
export function FinanceCard({ className }: { className?: string }) {
  const { accounts, transactions } = useFinance()
  const thisMonth = monthKey(todayIso())

  const { total, income, expense } = useMemo(() => {
    const total = accounts.reduce((sum, a) => sum + a.balance, 0)
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (monthKey(t.date) !== thisMonth) continue
      if (t.kind === 'ingreso') income += t.amount
      else expense += t.amount
    }
    return { total, income, expense }
  }, [accounts, transactions, thisMonth])

  return (
    <Card className={cx('flex flex-col', className)}>
      <CardHeader
        title="Finanzas"
        action={
          <Link
            to="/finanzas"
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted transition-colors hover:text-content"
          >
            Ver cuentas
            <TrendingUp size={13} aria-hidden />
          </Link>
        }
      />

      <p className="text-[11px] font-bold uppercase tracking-wide text-content-subtle">
        Balance total
      </p>
      <p className="mt-0.5 text-[26px] font-extrabold tabular leading-none tracking-tight text-content">
        {formatCOP(total)}
      </p>

      <div className="mt-4 flex gap-2">
        <div className="flex-1 rounded-2xl bg-ok-soft p-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok">
            <ArrowUpRight size={12} aria-hidden />
            Ingresos
          </span>
          <p className="mt-1 truncate text-sm font-extrabold tabular text-content">
            {formatCOP(income)}
          </p>
        </div>
        <div className="flex-1 rounded-2xl bg-danger-soft p-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger">
            <ArrowDownRight size={12} aria-hidden />
            Gastos
          </span>
          <p className="mt-1 truncate text-sm font-extrabold tabular text-content">
            {formatCOP(expense)}
          </p>
        </div>
      </div>

      {accounts.length === 0 && (
        <p className="mt-3 text-xs text-content-subtle">
          Aún no has creado cuentas. Añádelas en Finanzas.
        </p>
      )}
    </Card>
  )
}
