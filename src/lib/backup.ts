import type { Account, BackupData, Budget, Goal, Transaction } from '../data/types'
import { accountsStore, budgetsStore, goalsStore, transactionsStore } from '../hooks/useStores'
import { todayISO } from './dates'

/**
 * Respaldo local de todo lo que hay en la app. Sin esto, la única copia de los datos
 * vivía en Supabase; si algo le pasa a la cuenta, no había de dónde recuperarlos.
 */
export function buildBackup(
  accounts: Account[],
  transactions: Transaction[],
  budgets: (Budget & { id: string })[],
  goals: Goal[],
): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts,
    transactions,
    budgets,
    goals,
  }
}

/** Dispara la descarga del respaldo como archivo JSON. */
export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mis-finanzas-${todayISO()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  ok: boolean
  message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Valida y aplica un respaldo. Se revisa la forma del archivo antes de escribir nada:
 * un JSON cualquiera no debe poder dejar los stores en un estado inconsistente.
 */
export function importBackup(raw: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'El archivo no es un JSON válido.' }
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    return { ok: false, message: 'El archivo no parece un respaldo de esta app.' }
  }

  const { accounts, transactions, budgets, goals } = parsed
  if (
    !Array.isArray(accounts) ||
    !Array.isArray(transactions) ||
    !Array.isArray(budgets) ||
    !Array.isArray(goals)
  ) {
    return { ok: false, message: 'Al respaldo le faltan datos.' }
  }

  const everyHasId = (items: unknown[]) =>
    items.every((i) => isRecord(i) && typeof i.id === 'string' && typeof i.updatedAt === 'string')

  if (![accounts, transactions, budgets, goals].every(everyHasId)) {
    return { ok: false, message: 'Algunos registros del respaldo están incompletos.' }
  }

  accountsStore.replaceAll(accounts as Account[])
  transactionsStore.replaceAll(transactions as Transaction[])
  budgetsStore.replaceAll(budgets as (Budget & { id: string })[])
  goalsStore.replaceAll(goals as Goal[])

  return {
    ok: true,
    message: `Se importaron ${accounts.length} cuentas y ${transactions.length} movimientos.`,
  }
}
