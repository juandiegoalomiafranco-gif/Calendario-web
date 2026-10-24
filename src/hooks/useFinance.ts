import { useCallback } from 'react'
import { Banknote, CreditCard, Landmark, TrendingUp, type LucideIcon } from 'lucide-react'
import { COLORS, type ColorStyles } from '../data/palette'
import { createCollection, newId } from '../lib/cloudStore'
import { todayIso } from '../lib/dates'
import { rendimientoEA } from '../lib/finance'

export type AccountKind = 'efectivo' | 'ahorros' | 'inversion' | 'externa'
export type TxKind = 'gasto' | 'ingreso'

/**
 * De quién salió la plata. Es la distinción central de este módulo: lo que pagan
 * los papás NO baja el saldo propio; solo suma al total mensual «de mis papás»,
 * con su propio desglose por categoría.
 */
export type MoneySource = 'mia' | 'papas'

export const MONEY_SOURCE_META: Record<MoneySource, { label: string; short: string }> = {
  mia: { label: 'Mi plata', short: 'Mía' },
  papas: { label: 'Plata de mis papás', short: 'Papás' },
}

export interface Account {
  id: string
  name: string
  kind: AccountKind
  balance: number
  /**
   * Tasa **efectiva anual** (EA), como la anuncia el banco: 11 = 11 % EA. Antes se leía
   * como interés mensual, y con un 11 se habría sumado el 11 % cada mes.
   */
  interestPct?: number
  interestDay?: number
  notes?: string
}
export interface Transaction {
  id: string
  date: string
  amount: number
  kind: TxKind
  /** De quién es la plata. Solo la propia mueve saldos. */
  source: MoneySource
  accountId?: string
  category?: string
  /** Detalle libre del origen: «tarjeta de papá», «efectivo que me dieron»… */
  sourceDetail?: string
  description?: string
}
export interface Transfer {
  id: string
  date: string
  fromAccountId: string
  toAccountId: string
  amount: number
  notes?: string
}
/** «debo»: le tengo que pagar a alguien. «me_deben»: alguien me tiene que pagar. */
export type DebtDirection = 'debo' | 'me_deben'

export interface Debt {
  id: string
  direction: DebtDirection
  person: string
  amount: number
  concept?: string
  /** Para cuándo quedó el pago. Opcional: hay préstamos sin fecha. */
  dueDate?: string
  /** Fecha en que se saldó. Mientras falte, sigue pendiente. */
  paidAt?: string
  /** Cuenta por la que entró o salió la plata al saldarla. */
  paidAccountId?: string
  /** Movimiento creado al saldarla, para poder deshacerlo sin descuadrar el saldo. */
  paidTxId?: string
  notes?: string
}

export const DEBT_DIRECTION_META: Record<
  DebtDirection,
  { label: string; pay: string; paid: string; category: string; txKind: TxKind }
> = {
  me_deben: {
    label: 'Me deben',
    pay: 'Ya me pagó',
    paid: 'Ya me pagaron',
    category: 'Me pagaron',
    txKind: 'ingreso',
  },
  debo: {
    label: 'Debo',
    pay: 'Ya pagué',
    paid: 'Ya pagué',
    category: 'Pago de deuda',
    txKind: 'gasto',
  },
}

export interface FinanceCategory {
  id: string
  name: string
  kind: TxKind
}

export const ACCOUNT_KIND_META: Record<
  AccountKind,
  { label: string; Icon: LucideIcon; color: ColorStyles }
> = {
  efectivo: { label: 'Efectivo', Icon: Banknote, color: COLORS.green },
  ahorros: { label: 'Ahorros', Icon: Landmark, color: COLORS.blue },
  inversion: { label: 'Inversión / CDT', Icon: TrendingUp, color: COLORS.violet },
  externa: { label: 'Externa (tarjeta papá)', Icon: CreditCard, color: COLORS.amber },
}

interface AccountRow {
  id: string
  name: string
  kind: string
  balance: number
  interest_pct: number | null
  interest_day: number | null
  notes: string | null
}
interface TxRow {
  id: string
  date: string
  amount: number
  kind: string
  source: string | null
  account_id: string | null
  category: string | null
  source_detail: string | null
  description: string | null
}
interface TransferRow {
  id: string
  date: string
  from_account_id: string
  to_account_id: string
  amount: number
  notes: string | null
}
interface DebtRow {
  id: string
  direction: string
  person: string
  amount: number
  concept: string | null
  due_date: string | null
  paid_at: string | null
  paid_account_id: string | null
  paid_tx_id: string | null
  notes: string | null
}
interface CategoryRow {
  id: string
  name: string
  kind: string
}

const accountsStore = createCollection<Account, AccountRow>({
  key: 'mivida:accounts:v1',
  table: 'accounts',
  rowToItem: (r) => ({
    id: r.id,
    name: r.name,
    kind: (r.kind as AccountKind) ?? 'efectivo',
    balance: Number(r.balance ?? 0),
    interestPct: r.interest_pct ?? undefined,
    interestDay: r.interest_day ?? undefined,
    notes: r.notes ?? undefined,
  }),
  itemToRow: (a, userId) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    kind: a.kind,
    balance: a.balance,
    interest_pct: a.interestPct ?? null,
    interest_day: a.interestDay ?? null,
    notes: a.notes ?? null,
    updated_at: new Date().toISOString(),
  }),
})

const txStore = createCollection<Transaction, TxRow>({
  key: 'mivida:transactions:v1',
  table: 'transactions',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    amount: Number(r.amount ?? 0),
    kind: (r.kind as TxKind) ?? 'gasto',
    source: r.source === 'papas' ? 'papas' : 'mia',
    accountId: r.account_id ?? undefined,
    category: r.category ?? undefined,
    sourceDetail: r.source_detail ?? undefined,
    description: r.description ?? undefined,
  }),
  itemToRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    date: t.date,
    amount: t.amount,
    kind: t.kind,
    source: t.source,
    account_id: t.accountId ?? null,
    category: t.category ?? null,
    source_detail: t.sourceDetail ?? null,
    description: t.description ?? null,
  }),
})

const transfersStore = createCollection<Transfer, TransferRow>({
  key: 'mivida:transfers:v1',
  table: 'transfers',
  rowToItem: (r) => ({
    id: r.id,
    date: r.date,
    fromAccountId: r.from_account_id,
    toAccountId: r.to_account_id,
    amount: Number(r.amount ?? 0),
    notes: r.notes ?? undefined,
  }),
  itemToRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    date: t.date,
    from_account_id: t.fromAccountId,
    to_account_id: t.toAccountId,
    amount: t.amount,
    notes: t.notes ?? null,
  }),
})

const categoriesStore = createCollection<FinanceCategory, CategoryRow>({
  key: 'mivida:finance-categories:v1',
  table: 'finance_categories',
  rowToItem: (r) => ({ id: r.id, name: r.name, kind: (r.kind as TxKind) ?? 'gasto' }),
  itemToRow: (c, userId) => ({ id: c.id, user_id: userId, name: c.name, kind: c.kind }),
})

const debtsStore = createCollection<Debt, DebtRow>({
  key: 'mivida:debts:v1',
  table: 'debts',
  rowToItem: (r) => ({
    id: r.id,
    direction: r.direction === 'debo' ? 'debo' : 'me_deben',
    person: r.person,
    amount: Number(r.amount ?? 0),
    concept: r.concept ?? undefined,
    dueDate: r.due_date ?? undefined,
    paidAt: r.paid_at ?? undefined,
    paidAccountId: r.paid_account_id ?? undefined,
    paidTxId: r.paid_tx_id ?? undefined,
    notes: r.notes ?? undefined,
  }),
  itemToRow: (d, userId) => ({
    id: d.id,
    user_id: userId,
    direction: d.direction,
    person: d.person,
    amount: d.amount,
    concept: d.concept ?? null,
    due_date: d.dueDate ?? null,
    paid_at: d.paidAt ?? null,
    paid_account_id: d.paidAccountId ?? null,
    paid_tx_id: d.paidTxId ?? null,
    notes: d.notes ?? null,
  }),
})

function adjustBalance(accountId: string | undefined, delta: number) {
  if (!accountId) return
  const acc = accountsStore.get().find((a) => a.id === accountId)
  if (acc) accountsStore.upsert({ ...acc, balance: acc.balance + delta })
}

export function useFinance() {
  const accounts = accountsStore.useAll()
  const transactions = txStore.useAll()
  const transfers = transfersStore.useAll()
  const categories = categoriesStore.useAll()
  const debts = debtsStore.useAll()

  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    accountsStore.upsert({ ...a, id: newId() })
  }, [])
  const updateAccount = useCallback((a: Account) => accountsStore.upsert(a), [])
  const removeAccount = useCallback((id: string) => accountsStore.remove(id), [])

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const tx = { ...t, id: newId() }
    txStore.upsert(tx)
    // Lo de los papás se registra pero no mueve saldos: su plata no es tu patrimonio.
    if (tx.source === 'mia') {
      adjustBalance(tx.accountId, tx.kind === 'ingreso' ? tx.amount : -tx.amount)
    }
  }, [])

  const removeTransaction = useCallback((id: string) => {
    const tx = txStore.get().find((t) => t.id === id)
    if (tx && tx.source === 'mia') {
      adjustBalance(tx.accountId, tx.kind === 'ingreso' ? -tx.amount : tx.amount)
    }
    txStore.remove(id)
  }, [])

  const addTransfer = useCallback((t: Omit<Transfer, 'id'>) => {
    transfersStore.upsert({ ...t, id: newId() })
    adjustBalance(t.fromAccountId, -t.amount)
    adjustBalance(t.toAccountId, t.amount)
  }, [])

  const removeTransfer = useCallback((id: string) => {
    const tr = transfersStore.get().find((t) => t.id === id)
    if (tr) {
      adjustBalance(tr.fromAccountId, tr.amount)
      adjustBalance(tr.toAccountId, -tr.amount)
    }
    transfersStore.remove(id)
  }, [])

  const addCategory = useCallback((name: string, kind: TxKind) => {
    const clean = name.trim()
    if (!clean) return
    if (categoriesStore.get().some((c) => c.name.toLowerCase() === clean.toLowerCase() && c.kind === kind)) return
    categoriesStore.upsert({ id: newId(), name: clean, kind })
  }, [])
  const removeCategory = useCallback((id: string) => categoriesStore.remove(id), [])

  const renameCategory = useCallback((id: string, name: string) => {
    const clean = name.trim()
    const cat = categoriesStore.get().find((c) => c.id === id)
    if (!clean || !cat) return
    categoriesStore.upsert({ ...cat, name: clean })
  }, [])

  const addDebt = useCallback((d: Omit<Debt, 'id'>) => {
    debtsStore.upsert({ ...d, id: newId() })
  }, [])
  const updateDebt = useCallback((d: Debt) => debtsStore.upsert(d), [])
  /** Borrar una deuda no toca el movimiento con que se saldó: esa plata sí se movió. */
  const removeDebt = useCallback((id: string) => debtsStore.remove(id), [])

  /**
   * Salda una deuda. Con cuenta, la plata entra («me deben») o sale («debo») de verdad:
   * se crea el movimiento y el saldo se ajusta. Sin cuenta, solo queda marcada.
   */
  const markDebtPaid = useCallback((id: string, date: string, accountId?: string) => {
    const debt = debtsStore.get().find((d) => d.id === id)
    if (!debt || debt.paidAt) return
    let paidTxId: string | undefined
    if (accountId) {
      const meta = DEBT_DIRECTION_META[debt.direction]
      const tx: Transaction = {
        id: newId(),
        date,
        amount: debt.amount,
        kind: meta.txKind,
        source: 'mia',
        accountId,
        category: meta.category,
        description:
          debt.direction === 'me_deben'
            ? `${debt.person} me pagó${debt.concept ? ` · ${debt.concept}` : ''}`
            : `Le pagué a ${debt.person}${debt.concept ? ` · ${debt.concept}` : ''}`,
      }
      txStore.upsert(tx)
      adjustBalance(accountId, meta.txKind === 'ingreso' ? tx.amount : -tx.amount)
      paidTxId = tx.id
    }
    debtsStore.upsert({ ...debt, paidAt: date, paidAccountId: accountId, paidTxId })
  }, [])

  /** Vuelve a dejarla pendiente y devuelve el saldo como estaba. */
  const unmarkDebtPaid = useCallback((id: string) => {
    const debt = debtsStore.get().find((d) => d.id === id)
    if (!debt) return
    if (debt.paidTxId) {
      const tx = txStore.get().find((t) => t.id === debt.paidTxId)
      if (tx) {
        adjustBalance(tx.accountId, tx.kind === 'ingreso' ? -tx.amount : tx.amount)
        txStore.remove(tx.id)
      }
    }
    debtsStore.upsert({
      ...debt,
      paidAt: undefined,
      paidAccountId: undefined,
      paidTxId: undefined,
    })
  }, [])

  /**
   * Aplica la mesada (a la cuenta indicada) y el interés de un mes de cada cuenta de
   * ahorro/CDT. `interestPct` es la tasa EA, así que el mes se saca con su equivalente
   * compuesto (`rendimientoEA`), no dividiendo entre 12. Reversible: crea
   * transacciones que se pueden borrar.
   */
  const applyMonthly = useCallback((mesada: number, personalAccountId?: string) => {
    const date = todayIso()
    if (personalAccountId && mesada > 0) {
      const tx = {
        id: newId(),
        date,
        amount: mesada,
        kind: 'ingreso' as TxKind,
        source: 'mia' as MoneySource,
        accountId: personalAccountId,
        category: 'Mesada',
        description: 'Mesada mensual',
      }
      txStore.upsert(tx)
      adjustBalance(personalAccountId, mesada)
    }
    for (const a of accountsStore.get()) {
      if (a.interestPct && a.interestPct > 0 && (a.kind === 'ahorros' || a.kind === 'inversion')) {
        const interest = Math.round(rendimientoEA(a.balance, a.interestPct).mensual)
        if (interest > 0) {
          const tx = {
            id: newId(),
            date,
            amount: interest,
            kind: 'ingreso' as TxKind,
            source: 'mia' as MoneySource,
            accountId: a.id,
            category: 'Interés',
            description: `Interés del mes (${a.interestPct} % EA)`,
          }
          txStore.upsert(tx)
          adjustBalance(a.id, interest)
        }
      }
    }
  }, [])

  return {
    accounts,
    transactions,
    transfers,
    categories,
    debts,
    addAccount,
    updateAccount,
    removeAccount,
    addTransaction,
    removeTransaction,
    addTransfer,
    removeTransfer,
    addCategory,
    removeCategory,
    renameCategory,
    applyMonthly,
    addDebt,
    updateDebt,
    removeDebt,
    markDebtPaid,
    unmarkDebtPaid,
  }
}
