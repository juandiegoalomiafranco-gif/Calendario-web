/** Tipos de la app de finanzas. Todos los montos están en pesos colombianos (COP). */

export type AccountKind =
  | 'efectivo'
  | 'banco'
  | 'nequi'
  | 'daviplata'
  | 'ahorro'
  | 'inversion'
  | 'tarjeta'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  /** Plata que ya había en la cuenta antes de empezar a registrar movimientos. */
  initialBalance: number
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type TxType = 'ingreso' | 'gasto' | 'transferencia'

export interface Transaction {
  id: string
  accountId: string
  type: TxType
  /** Siempre positivo: el signo lo da `type`. */
  amount: number
  /** YYYY-MM-DD en hora local. */
  date: string
  category: string
  note?: string
  /** Cuenta destino — solo en transferencias. */
  toAccountId?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  /** La categoría es la llave: un límite mensual por categoría. */
  category: string
  monthlyLimit: number
  updatedAt: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  /** YYYY-MM-DD, opcional: sin fecha la meta no tiene plazo. */
  targetDate?: string
  /** Si apunta a una cuenta, el avance se lee del saldo de esa cuenta. */
  accountId?: string
  /** Avance manual, cuando la meta no está ligada a una cuenta. */
  savedAmount: number
  createdAt: string
  updatedAt: string
}

/** Todo lo que entra y sale del respaldo JSON. */
export interface BackupData {
  version: 1
  exportedAt: string
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
}
