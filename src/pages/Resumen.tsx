import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AccountCard } from '../components/AccountCard'
import { EmptyState } from '../components/EmptyState'
import { ProgressRing } from '../components/ProgressRing'
import { SaveIndicator } from '../components/SaveIndicator'
import { StatCard } from '../components/StatCard'
import { TransactionRow } from '../components/TransactionRow'
import { BreakdownBars } from '../components/charts/BreakdownBars'
import { TrendLine } from '../components/charts/TrendLine'
import { categoryById } from '../data/categories'
import { useAccounts, useBudgets, useGoals, useTransactions } from '../hooks/useStores'
import { currentMonth, formatMonthShort, lastMonths } from '../lib/dates'
import { formatCompact, formatMoney, formatPercent } from '../lib/format'
import {
  accountsWithBalance,
  budgetStatus,
  expenseByCategory,
  goalsByUrgency,
  monthSummary,
  netWorth,
  netWorthByMonth,
  transactionsInMonth,
} from '../lib/finanzas'

export function Resumen() {
  const accounts = useAccounts()
  const transactions = useTransactions()
  const budgets = useBudgets()
  const goals = useGoals()
  const month = currentMonth()

  const total = useMemo(() => netWorth(accounts, transactions), [accounts, transactions])
  const withBalance = useMemo(
    () => accountsWithBalance(accounts, transactions),
    [accounts, transactions],
  )
  const summary = useMemo(() => monthSummary(transactions, month), [transactions, month])

  const topCategories = useMemo(
    () =>
      expenseByCategory(transactions, month)
        .slice(0, 5)
        .map((e) => {
          const meta = categoryById(e.category)
          return {
            key: e.category,
            emoji: meta.emoji,
            label: meta.label,
            value: e.total,
            display: formatMoney(e.total),
            colorClass: meta.colorClass,
          }
        }),
    [transactions, month],
  )

  const budgetTotals = useMemo(() => {
    const rows = budgetStatus(budgets, transactions, month)
    const limit = rows.reduce((s, r) => s + r.limit, 0)
    const spent = rows.reduce((s, r) => s + r.spent, 0)
    return { limit, spent, fraction: limit > 0 ? spent / limit : 0, count: rows.length }
  }, [budgets, transactions, month])

  const netWorthTrend = useMemo(() => {
    const months = lastMonths(month, 6)
    const values = netWorthByMonth(accounts, transactions, months)
    return months.map((m, i) => ({
      label: formatMonthShort(m),
      value: values[i],
      display: formatCompact(values[i]),
    }))
  }, [accounts, transactions, month])

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [transactions],
  )

  const nearestGoals = useMemo(
    () => goalsByUrgency(goals, accounts, transactions).filter((g) => !g.done).slice(0, 2),
    [goals, accounts, transactions],
  )

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-3xl font-bold text-ink-900">Resumen</h1>
        </header>
        <EmptyState
          emoji="🏦"
          title="Todavía no hay cuentas"
          description="Registra dónde tienes tu plata para ver tu patrimonio y empezar a anotar movimientos."
          actionLabel="Registrar mis cuentas"
          actionTo="/bienvenida"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Resumen</h1>
          <SaveIndicator />
        </div>
        <Link
          to="/ajustes"
          aria-label="Ajustes"
          className="w-11 h-11 shrink-0 rounded-full bg-card shadow-card flex items-center justify-center text-lg"
        >
          <span aria-hidden>⚙️</span>
        </Link>
      </header>

      <div className="rounded-4xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          Patrimonio total
        </p>
        <p className="text-4xl font-bold text-white mt-1 tabular-nums">{formatMoney(total)}</p>
        <p className="text-sm text-white/80 mt-1.5">
          en {withBalance.length} {withBalance.length === 1 ? 'cuenta' : 'cuentas'}
        </p>
      </div>

      <div className="flex gap-3">
        <StatCard
          label="Ingresos del mes"
          value={formatMoney(summary.income)}
          icon="⬆️"
          tone="ok"
        />
        <StatCard
          label="Gastos del mes"
          value={formatMoney(summary.expense)}
          icon="⬇️"
          tone={summary.expense > summary.income ? 'danger' : 'default'}
        />
      </div>

      <StatCard
        label="Te quedó este mes"
        value={formatMoney(summary.net)}
        icon={summary.net >= 0 ? '🟢' : '🔴'}
        tone={summary.net >= 0 ? 'ok' : 'danger'}
        caption={
          summary.net >= 0
            ? 'ingresos menos gastos'
            : 'estás gastando más de lo que entra este mes'
        }
      />

      {budgetTotals.count > 0 && (
        <Link to="/presupuesto" className="rounded-3xl bg-card shadow-card p-4 flex items-center gap-4">
          <ProgressRing
            value={budgetTotals.fraction * 100}
            size={72}
            strokeWidth={9}
            progressColor={budgetTotals.spent > budgetTotals.limit ? '#e5484d' : '#fb5a17'}
          >
            <span className="text-sm font-bold text-ink-900">
              {formatPercent(budgetTotals.fraction)}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Presupuesto del mes</p>
            <p className="text-sm text-ink-500 tabular-nums">
              {formatMoney(budgetTotals.spent)} de {formatMoney(budgetTotals.limit)}
            </p>
            {budgetTotals.spent > budgetTotals.limit && (
              <p className="text-xs text-danger-400 mt-0.5">
                Te pasaste por {formatMoney(budgetTotals.spent - budgetTotals.limit)}
              </p>
            )}
          </div>
        </Link>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Mis cuentas</h2>
        {withBalance.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </section>

      {topCategories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">En qué se fue este mes</h2>
          <BreakdownBars rows={topCategories} label="Gasto del mes por categoría" />
        </section>
      )}

      {netWorthTrend.length >= 2 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Cómo va tu patrimonio</h2>
          <TrendLine
            points={netWorthTrend}
            unit="patrimonio al cierre de cada mes"
            color="#18ba60"
            label="Evolución del patrimonio en los últimos seis meses"
          />
        </section>
      )}

      {nearestGoals.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Metas cercanas</h2>
            <Link to="/metas" className="text-sm font-medium text-brand-300">
              Ver todas
            </Link>
          </div>
          {nearestGoals.map((g) => (
            <Link
              key={g.goal.id}
              to="/metas"
              className="rounded-3xl bg-card shadow-card p-4 flex items-center gap-4"
            >
              <ProgressRing value={g.fraction * 100} size={60} strokeWidth={8}>
                <span className="text-xs font-bold text-ink-900">{formatPercent(g.fraction)}</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{g.goal.name}</p>
                <p className="text-xs text-ink-500 tabular-nums">
                  Faltan {formatMoney(g.remaining)}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Últimos movimientos</h2>
          <Link to="/movimientos" className="text-sm font-medium text-brand-300">
            Ver todos
          </Link>
        </div>
        {recent.length > 0 ? (
          recent.map((tx) => <TransactionRow key={tx.id} transaction={tx} accounts={accounts} />)
        ) : (
          <EmptyState
            emoji="🧾"
            title="Sin movimientos todavía"
            description={
              transactionsInMonth(transactions, month).length === 0
                ? 'Anota tu primer gasto o ingreso y el saldo de tus cuentas se actualiza solo.'
                : 'Anota un movimiento para verlo aquí.'
            }
            actionLabel="Anotar un movimiento"
            actionTo="/movimientos/nuevo"
          />
        )}
      </section>
    </div>
  )
}
