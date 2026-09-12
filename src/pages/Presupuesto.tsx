import { useMemo, useState } from 'react'
import { MonthNav } from '../components/MonthNav'
import { MoneyInput } from '../components/MoneyInput'
import { SaveIndicator } from '../components/SaveIndicator'
import { EXPENSE_CATEGORIES, categoryById } from '../data/categories'
import { budgetsStore, useBudgets, useTransactions } from '../hooks/useStores'
import { currentMonth } from '../lib/dates'
import { formatMoney, formatPercent } from '../lib/format'
import { budgetStatus } from '../lib/finanzas'

export function Presupuesto() {
  const budgets = useBudgets()
  const transactions = useTransactions()
  const [month, setMonth] = useState(currentMonth())
  const [editing, setEditing] = useState(false)

  const statuses = useMemo(
    () => budgetStatus(budgets, transactions, month),
    [budgets, transactions, month],
  )

  const totals = useMemo(() => {
    const limit = statuses.reduce((s, r) => s + r.limit, 0)
    const spent = statuses.reduce((s, r) => s + r.spent, 0)
    return { limit, spent, remaining: limit - spent }
  }, [statuses])

  const limitOf = (category: string) =>
    budgets.find((b) => b.category === category)?.monthlyLimit ?? 0

  function setLimit(category: string, monthlyLimit: number) {
    // La categoría es el id: así solo existe un límite por categoría y la
    // actualización no crea duplicados.
    budgetsStore.save({ id: category, category, monthlyLimit })
  }

  const isCurrent = month === currentMonth()

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Presupuesto</h1>
          <SaveIndicator />
        </div>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="min-h-[44px] px-4 rounded-full bg-card shadow-card text-sm font-medium text-brand-300"
        >
          {editing ? 'Listo' : 'Editar'}
        </button>
      </header>

      <MonthNav month={month} onChange={setMonth} />

      {!isCurrent && (
        <p className="text-xs text-ink-500 bg-ink-100 rounded-2xl p-3">
          Los límites son mensuales y siempre los mismos: aquí ves cómo te fue en ese mes
          contra el límite que tienes puesto hoy.
        </p>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-500">
            Pon cuánto quieres gastar al mes en cada cosa. Deja el campo en cero para no
            llevar control de esa categoría.
          </p>
          {EXPENSE_CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-3xl bg-card shadow-card p-4 flex items-center gap-3">
              <span className="text-xl w-7 text-center shrink-0" aria-hidden>
                {c.emoji}
              </span>
              <label className="flex-1 min-w-0 flex flex-col gap-1 text-xs text-ink-500">
                {c.label}
                <MoneyInput
                  value={limitOf(c.id)}
                  onChange={(value) => setLimit(c.id, value)}
                />
              </label>
            </div>
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <div className="rounded-3xl bg-card shadow-card p-6 flex flex-col items-center text-center gap-2">
          <span className="text-4xl" aria-hidden>
            🎚️
          </span>
          <h3 className="text-base font-semibold text-ink-900">Sin presupuesto todavía</h3>
          <p className="text-sm text-ink-500 max-w-[22rem]">
            Ponle un límite mensual a las categorías que más se te van y la app te avisa
            cuando te estés pasando.
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 inline-flex items-center justify-center min-h-[44px] px-5 rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600"
          >
            Poner mis límites
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-4xl bg-card shadow-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm text-ink-500">Total del mes</p>
              <p className="text-sm font-semibold text-ink-600 tabular-nums">
                {formatMoney(totals.spent)} / {formatMoney(totals.limit)}
              </p>
            </div>
            <div className="h-3 rounded-full bg-ink-100 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${
                  totals.spent > totals.limit ? 'bg-danger-500' : 'bg-brand-500'
                }`}
                style={{
                  width: formatPercent(totals.limit > 0 ? totals.spent / totals.limit : 0),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p
              className={`text-sm font-semibold mt-2 tabular-nums ${
                totals.remaining >= 0 ? 'text-ok-400' : 'text-danger-400'
              }`}
            >
              {totals.remaining >= 0
                ? `Te quedan ${formatMoney(totals.remaining)}`
                : `Te pasaste por ${formatMoney(Math.abs(totals.remaining))}`}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {statuses.map((s) => {
              const meta = categoryById(s.category)
              // Ámbar desde el 80%: avisa antes de que sea tarde.
              const barClass = s.over
                ? 'bg-danger-500'
                : s.fraction >= 0.8
                  ? 'bg-amber-400'
                  : 'bg-ok-500'
              return (
                <div key={s.category} className="rounded-3xl bg-card shadow-card p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg w-6 text-center shrink-0" aria-hidden>
                      {meta.emoji}
                    </span>
                    <p className="flex-1 min-w-0 text-sm font-semibold text-ink-900 truncate">
                      {meta.label}
                    </p>
                    <p
                      className={`text-xs font-semibold tabular-nums shrink-0 ${
                        s.over ? 'text-danger-400' : 'text-ink-600'
                      }`}
                    >
                      {/* Sin acotar: si te pasaste, ver "170%" dice más que "100%". */}
                      {Math.round(s.fraction * 100)}%
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${barClass}`}
                      style={{ width: formatPercent(s.fraction) }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-1.5">
                    <p className="text-xs text-ink-500 tabular-nums">
                      {formatMoney(s.spent)} de {formatMoney(s.limit)}
                    </p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        s.over ? 'text-danger-400' : 'text-ok-400'
                      }`}
                    >
                      {s.over
                        ? `+${formatMoney(Math.abs(s.remaining))}`
                        : `quedan ${formatMoney(s.remaining)}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
