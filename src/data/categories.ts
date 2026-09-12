import type { AccountKind, TxType } from './types'

export interface CategoryDef {
  id: string
  label: string
  emoji: string
  /** Clase de fondo para la barra en las gráficas de desglose. */
  colorClass: string
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: 'mercado', label: 'Mercado', emoji: '🛒', colorClass: 'bg-ok-500' },
  { id: 'comida-fuera', label: 'Comida fuera', emoji: '🍔', colorClass: 'bg-brand-500' },
  { id: 'transporte', label: 'Transporte', emoji: '🚌', colorClass: 'bg-sky-500' },
  { id: 'vivienda', label: 'Vivienda', emoji: '🏠', colorClass: 'bg-amber-400' },
  { id: 'servicios', label: 'Servicios', emoji: '💡', colorClass: 'bg-brand-400' },
  { id: 'salud', label: 'Salud', emoji: '🩺', colorClass: 'bg-ok-400' },
  { id: 'educacion', label: 'Educación', emoji: '📚', colorClass: 'bg-sky-600' },
  { id: 'ocio', label: 'Ocio', emoji: '🎬', colorClass: 'bg-brand-600' },
  { id: 'ropa', label: 'Ropa', emoji: '👕', colorClass: 'bg-amber-500' },
  { id: 'suscripciones', label: 'Suscripciones', emoji: '📱', colorClass: 'bg-sky-400' },
  { id: 'deuda', label: 'Deuda / crédito', emoji: '💳', colorClass: 'bg-danger-500' },
  { id: 'otros-gastos', label: 'Otros', emoji: '📦', colorClass: 'bg-ink-400' },
]

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: 'salario', label: 'Salario', emoji: '💼', colorClass: 'bg-ok-500' },
  { id: 'freelance', label: 'Freelance', emoji: '🧑‍💻', colorClass: 'bg-sky-500' },
  { id: 'negocio', label: 'Negocio', emoji: '🏪', colorClass: 'bg-brand-500' },
  { id: 'rendimientos', label: 'Rendimientos', emoji: '📈', colorClass: 'bg-ok-400' },
  { id: 'regalo', label: 'Regalo', emoji: '🎁', colorClass: 'bg-amber-400' },
  { id: 'otros-ingresos', label: 'Otros', emoji: '➕', colorClass: 'bg-ink-400' },
]

export const TRANSFER_CATEGORY: CategoryDef = {
  id: 'transferencia',
  label: 'Transferencia',
  emoji: '🔁',
  colorClass: 'bg-ink-300',
}

export function categoriesFor(type: TxType): CategoryDef[] {
  if (type === 'ingreso') return INCOME_CATEGORIES
  if (type === 'transferencia') return [TRANSFER_CATEGORY]
  return EXPENSE_CATEGORIES
}

const BY_ID = new Map<string, CategoryDef>(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, TRANSFER_CATEGORY].map((c) => [c.id, c]),
)

/** Nunca devuelve undefined: una categoría desconocida se muestra con su propio id. */
export function categoryById(id: string): CategoryDef {
  return BY_ID.get(id) ?? { id, label: id, emoji: '📦', colorClass: 'bg-ink-400' }
}

export const ACCOUNT_KINDS: { id: AccountKind; label: string; emoji: string }[] = [
  { id: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { id: 'banco', label: 'Cuenta bancaria', emoji: '🏦' },
  { id: 'nequi', label: 'Nequi', emoji: '📲' },
  { id: 'daviplata', label: 'Daviplata', emoji: '📳' },
  { id: 'ahorro', label: 'Ahorros', emoji: '🐖' },
  { id: 'inversion', label: 'Inversión', emoji: '📊' },
  { id: 'tarjeta', label: 'Tarjeta de crédito', emoji: '💳' },
]

export function accountKindMeta(kind: AccountKind) {
  return ACCOUNT_KINDS.find((k) => k.id === kind) ?? ACCOUNT_KINDS[0]
}

/** La tarjeta de crédito es deuda: su saldo resta del patrimonio. */
export function isDebtAccount(kind: AccountKind): boolean {
  return kind === 'tarjeta'
}
