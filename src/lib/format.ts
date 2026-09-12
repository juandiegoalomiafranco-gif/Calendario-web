/** Formato de montos en pesos colombianos. */

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const COP_COMPACT = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** "$ 1.250.000". Redondea a pesos enteros: nadie lleva centavos en efectivo. */
export function formatMoney(amount: number): string {
  return COP.format(Math.round(amount))
}

/** Con signo explícito: "+$ 2.000.000" para ingresos, "−$ 45.000" para gastos. */
export function formatSigned(amount: number): string {
  if (amount === 0) return formatMoney(0)
  const sign = amount > 0 ? '+' : '−'
  return `${sign}${formatMoney(Math.abs(amount))}`
}

/** "1,2 M" — para ejes de gráficas donde no cabe el monto completo. */
export function formatCompact(amount: number): string {
  return COP_COMPACT.format(Math.round(amount))
}

/** Solo los dígitos agrupados, sin símbolo: para el input de monto. */
export function formatAmountInput(amount: number): string {
  return amount === 0 ? '' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount)
}

/**
 * Lee un monto escrito a mano y tolera cómo se escribe la plata en Colombia:
 * puntos de miles, comas de miles, espacios, el símbolo `$`. Devuelve 0 si no hay número.
 */
export function parseAmountInput(text: string): number {
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return 0
  const n = Number(digits)
  return Number.isFinite(n) ? n : 0
}

/** "38%" a partir de una fracción 0-1, acotado a 0-100 para las barras. */
export function formatPercent(fraction: number): string {
  return `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`
}
