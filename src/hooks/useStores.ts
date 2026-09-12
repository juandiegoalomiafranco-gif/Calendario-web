import { useSyncExternalStore } from 'react'
import { createSyncedStore, retryOnReconnect, type SyncState } from '../lib/createSyncedStore'
import type { Account, AccountKind, Budget, Goal, Transaction, TxType } from '../data/types'

// --- Filas de Supabase (snake_case) -----------------------------------------

interface AccountRow {
  id: string
  user_id: string
  name: string
  kind: string
  initial_balance: number
  archived: boolean
  created_at: string
  updated_at: string
}

interface TransactionRow {
  id: string
  user_id: string
  account_id: string
  type: string
  amount: number
  date: string
  category: string
  note: string | null
  to_account_id: string | null
  created_at: string
  updated_at: string
}

interface BudgetRow {
  id: string
  user_id: string
  category: string
  monthly_limit: number
  updated_at: string
}

interface GoalRow {
  id: string
  user_id: string
  name: string
  target_amount: number
  target_date: string | null
  account_id: string | null
  saved_amount: number
  created_at: string
  updated_at: string
}

// --- Stores -----------------------------------------------------------------

export const accountsStore = createSyncedStore<Account, AccountRow>({
  storageKey: 'finanzas:accounts:v1',
  table: 'accounts',
  toRow: (a, userId) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    kind: a.kind,
    initial_balance: a.initialBalance,
    archived: a.archived,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }),
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind as AccountKind,
    initialBalance: Number(r.initial_balance),
    archived: r.archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
})

export const transactionsStore = createSyncedStore<Transaction, TransactionRow>({
  storageKey: 'finanzas:transactions:v1',
  table: 'transactions',
  toRow: (t, userId) => ({
    id: t.id,
    user_id: userId,
    account_id: t.accountId,
    type: t.type,
    amount: t.amount,
    date: t.date,
    category: t.category,
    note: t.note ?? null,
    to_account_id: t.toAccountId ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }),
  fromRow: (r) => ({
    id: r.id,
    accountId: r.account_id,
    type: r.type as TxType,
    amount: Number(r.amount),
    date: r.date,
    category: r.category,
    note: r.note ?? undefined,
    toAccountId: r.to_account_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
})

/** El presupuesto usa la categoría como id: un límite por categoría. */
type BudgetItem = Budget & { id: string }

export const budgetsStore = createSyncedStore<BudgetItem, BudgetRow>({
  storageKey: 'finanzas:budgets:v1',
  table: 'budgets',
  toRow: (b, userId) => ({
    id: b.id,
    user_id: userId,
    category: b.category,
    monthly_limit: b.monthlyLimit,
    updated_at: b.updatedAt,
  }),
  fromRow: (r) => ({
    id: r.id,
    category: r.category,
    monthlyLimit: Number(r.monthly_limit),
    updatedAt: r.updated_at,
  }),
})

export const goalsStore = createSyncedStore<Goal, GoalRow>({
  storageKey: 'finanzas:goals:v1',
  table: 'goals',
  toRow: (g, userId) => ({
    id: g.id,
    user_id: userId,
    name: g.name,
    target_amount: g.targetAmount,
    target_date: g.targetDate ?? null,
    account_id: g.accountId ?? null,
    saved_amount: g.savedAmount,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }),
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    targetAmount: Number(r.target_amount),
    targetDate: r.target_date ?? undefined,
    accountId: r.account_id ?? undefined,
    savedAmount: Number(r.saved_amount),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
})

export const ALL_STORES = [accountsStore, transactionsStore, budgetsStore, goalsStore]

retryOnReconnect(ALL_STORES)

export function setUserIdOnAllStores(userId: string | null) {
  for (const store of ALL_STORES) store.setUserId(userId)
}

// --- Hooks ------------------------------------------------------------------

export function useAccounts(): Account[] {
  return useSyncExternalStore(accountsStore.subscribe, accountsStore.getSnapshot)
}

export function useTransactions(): Transaction[] {
  return useSyncExternalStore(transactionsStore.subscribe, transactionsStore.getSnapshot)
}

export function useBudgets(): BudgetItem[] {
  return useSyncExternalStore(budgetsStore.subscribe, budgetsStore.getSnapshot)
}

export function useGoals(): Goal[] {
  return useSyncExternalStore(goalsStore.subscribe, goalsStore.getSnapshot)
}

/** El estado de guardado más "urgente" de todos los stores, para el indicador. */
export function useSyncState(): SyncState {
  const subscribe = (listener: () => void) => {
    const unsubs = ALL_STORES.map((s) => s.subscribe(listener))
    return () => unsubs.forEach((u) => u())
  }
  const getSnapshot = (): SyncState => {
    const states = ALL_STORES.map((s) => s.getSyncState())
    if (states.includes('saving')) return 'saving'
    if (states.includes('error')) return 'error'
    if (states.includes('offline')) return 'offline'
    if (states.includes('saved')) return 'saved'
    return 'idle'
  }
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Id corto y único para registros nuevos. */
export function newId(): string {
  return crypto.randomUUID()
}
