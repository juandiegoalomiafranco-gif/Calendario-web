import { isDebtAccount } from '../data/categories'
import type { Account, Budget, Goal, Transaction } from '../data/types'
import { monthOf, monthsBetween, todayISO } from './dates'

/**
 * Saldo de una cuenta: lo que había al empezar, más lo que entró, menos lo que salió.
 * Una transferencia suma en la cuenta destino y resta en la de origen, así que no
 * cambia el patrimonio total — solo mueve la plata de lugar.
 */
export function accountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.initialBalance
  for (const tx of transactions) {
    if (tx.type === 'ingreso' && tx.accountId === account.id) balance += tx.amount
    else if (tx.type === 'gasto' && tx.accountId === account.id) balance -= tx.amount
    else if (tx.type === 'transferencia') {
      if (tx.accountId === account.id) balance -= tx.amount
      if (tx.toAccountId === account.id) balance += tx.amount
    }
  }
  return balance
}

export interface AccountWithBalance extends Account {
  balance: number
}

/** Las cuentas activas con su saldo, de mayor a menor. */
export function accountsWithBalance(
  accounts: Account[],
  transactions: Transaction[],
): AccountWithBalance[] {
  return accounts
    .filter((a) => !a.archived)
    .map((a) => ({ ...a, balance: accountBalance(a, transactions) }))
    .sort((a, b) => b.balance - a.balance)
}

/**
 * Patrimonio total: la suma de los saldos, donde las cuentas de deuda
 * (tarjeta de crédito) restan en vez de sumar.
 */
export function netWorth(accounts: Account[], transactions: Transaction[]): number {
  return accounts
    .filter((a) => !a.archived)
    .reduce((total, a) => {
      const balance = accountBalance(a, transactions)
      return isDebtAccount(a.kind) ? total - Math.abs(balance) : total + balance
    }, 0)
}

export function transactionsInMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((tx) => monthOf(tx.date) === month)
}

export interface MonthSummary {
  income: number
  expense: number
  /** Ingresos menos gastos: lo que realmente te quedó en el mes. */
  net: number
}

/** Las transferencias se excluyen: mueven plata, no la generan ni la gastan. */
export function monthSummary(transactions: Transaction[], month: string): MonthSummary {
  let income = 0
  let expense = 0
  for (const tx of transactionsInMonth(transactions, month)) {
    if (tx.type === 'ingreso') income += tx.amount
    else if (tx.type === 'gasto') expense += tx.amount
  }
  return { income, expense, net: income - expense }
}

/** Gasto del mes agrupado por categoría, de mayor a menor. */
export function expenseByCategory(
  transactions: Transaction[],
  month: string,
): { category: string; total: number }[] {
  const totals = new Map<string, number>()
  for (const tx of transactionsInMonth(transactions, month)) {
    if (tx.type !== 'gasto') continue
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount)
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

/** Gasto total de cada mes de la lista, en el mismo orden. */
export function expenseByMonth(transactions: Transaction[], months: string[]): number[] {
  return months.map((m) => monthSummary(transactions, m).expense)
}

export interface BudgetStatus {
  category: string
  limit: number
  spent: number
  /** Lo que queda del límite; negativo cuando te pasaste. */
  remaining: number
  /** 0-1 sin acotar: puede pasar de 1 si hay exceso. */
  fraction: number
  over: boolean
}

export function budgetStatus(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): BudgetStatus[] {
  const spentByCategory = new Map(
    expenseByCategory(transactions, month).map((e) => [e.category, e.total]),
  )
  return budgets
    .filter((b) => b.monthlyLimit > 0)
    .map((b) => {
      const spent = spentByCategory.get(b.category) ?? 0
      return {
        category: b.category,
        limit: b.monthlyLimit,
        spent,
        remaining: b.monthlyLimit - spent,
        fraction: b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0,
        over: spent > b.monthlyLimit,
      }
    })
    .sort((a, b) => b.fraction - a.fraction)
}

export interface GoalProgress {
  goal: Goal
  saved: number
  remaining: number
  /** 0-1 acotado. */
  fraction: number
  done: boolean
  /** Cuánto habría que guardar cada mes para llegar a la fecha; null si no hay fecha. */
  monthlyNeeded: number | null
  /** true si la fecha objetivo ya pasó y la meta no está cumplida. */
  overdue: boolean
}

/**
 * Avance de una meta. Si está ligada a una cuenta, el avance es el saldo de esa
 * cuenta; si no, es el monto que el usuario anotó a mano.
 */
export function goalProgress(
  goal: Goal,
  accounts: Account[],
  transactions: Transaction[],
  today = todayISO(),
): GoalProgress {
  const linked = goal.accountId ? accounts.find((a) => a.id === goal.accountId) : undefined
  const saved = linked ? accountBalance(linked, transactions) : goal.savedAmount
  const remaining = Math.max(0, goal.targetAmount - saved)
  const done = remaining === 0 && goal.targetAmount > 0
  const monthsLeft = goal.targetDate ? monthsBetween(today, goal.targetDate) : null

  let monthlyNeeded: number | null = null
  if (goal.targetDate && !done) {
    // Sin meses completos por delante (la fecha es este mes o ya pasó), lo que falta
    // hay que conseguirlo de una: dividir por 0 daría Infinity.
    monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : remaining
  }

  return {
    goal,
    saved,
    remaining,
    fraction: goal.targetAmount > 0 ? Math.min(1, saved / goal.targetAmount) : 0,
    done,
    monthlyNeeded,
    overdue: !!goal.targetDate && goal.targetDate < today && !done,
  }
}

/** Las metas ordenadas por urgencia: primero las que tienen fecha más cercana. */
export function goalsByUrgency(
  goals: Goal[],
  accounts: Account[],
  transactions: Transaction[],
  today = todayISO(),
): GoalProgress[] {
  return goals
    .map((g) => goalProgress(g, accounts, transactions, today))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const da = a.goal.targetDate ?? '9999-12-31'
      const db = b.goal.targetDate ?? '9999-12-31'
      return da.localeCompare(db)
    })
}

/**
 * Patrimonio al cierre de cada mes de la lista, para la línea de evolución.
 * Parte del patrimonio actual y deshace los movimientos posteriores a cada mes,
 * de modo que el último punto siempre coincide con lo que muestra el Resumen.
 */
export function netWorthByMonth(
  accounts: Account[],
  transactions: Transaction[],
  months: string[],
): number[] {
  return months.map((month) => {
    const upToMonth = transactions.filter((tx) => monthOf(tx.date) <= month)
    return netWorth(accounts, upToMonth)
  })
}
