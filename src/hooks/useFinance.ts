import { useCallback } from 'react'
import { createCollection, newId } from '../lib/cloudStore'
import { todayISO } from '../data/plan'

export type AccountKind = 'efectivo' | 'ahorros' | 'inversion' | 'externa'
export type TxKind = 'gasto' | 'ingreso'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  balance: number
  interestPct?: number
  interestDay?: number
  notes?: string
}
export interface Transaction {
  id: string
  date: string
  amount: number
  kind: TxKind
  accountId?: string
  category?: string
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
export interface FinanceCategory {
  id: string
  name: string
  kind: TxKind
}

export const ACCOUNT_KIND_META: Record<AccountKind, { label: string; emoji: string }> = {
  efectivo: { label: 'Efectivo', emoji: '💵' },
  ahorros: { label: 'Ahorros', emoji: '🏦' },
  inversion: { label: 'Inversión / CDT', emoji: '📈' },
  externa: { label: 'Externa (tarjeta papá)', emoji: '💳' },
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

  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    accountsStore.upsert({ ...a, id: newId() })
  }, [])
  const updateAccount = useCallback((a: Account) => accountsStore.upsert(a), [])
  const removeAccount = useCallback((id: string) => accountsStore.remove(id), [])

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const tx = { ...t, id: newId() }
    txStore.upsert(tx)
    adjustBalance(tx.accountId, tx.kind === 'ingreso' ? tx.amount : -tx.amount)
  }, [])

  const removeTransaction = useCallback((id: string) => {
    const tx = txStore.get().find((t) => t.id === id)
    if (tx) adjustBalance(tx.accountId, tx.kind === 'ingreso' ? -tx.amount : tx.amount)
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

  /**
   * Aplica la mesada (a la cuenta indicada) y el interés mensual de cada cuenta de
   * ahorro/CDT según su interest_pct. Reversible: crea transacciones que se pueden borrar.
   */
  const applyMonthly = useCallback((mesada: number, personalAccountId?: string) => {
    const date = todayISO()
    if (personalAccountId && mesada > 0) {
      const tx = { id: newId(), date, amount: mesada, kind: 'ingreso' as TxKind, accountId: personalAccountId, category: 'Mesada', description: 'Mesada mensual' }
      txStore.upsert(tx)
      adjustBalance(personalAccountId, mesada)
    }
    for (const a of accountsStore.get()) {
      if (a.interestPct && a.interestPct > 0 && (a.kind === 'ahorros' || a.kind === 'inversion')) {
        const interest = Math.round(a.balance * (a.interestPct / 100))
        if (interest > 0) {
          const tx = { id: newId(), date, amount: interest, kind: 'ingreso' as TxKind, accountId: a.id, category: 'Interés', description: `Interés ${a.interestPct}%` }
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
    addAccount,
    updateAccount,
    removeAccount,
    addTransaction,
    removeTransaction,
    addTransfer,
    removeTransfer,
    addCategory,
    removeCategory,
    applyMonthly,
  }
}
