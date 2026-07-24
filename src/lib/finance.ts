const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCOP(n: number): string {
  return COP.format(Math.round(n || 0))
}

/** 'YYYY-MM' de una fecha ISO. */
export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7)
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function monthLabel(key: string): string {
  const m = Number(key.slice(5, 7)) - 1
  return `${MONTHS_SHORT[m] ?? '?'} ${key.slice(2, 4)}`
}

/** Últimos n meses (claves 'YYYY-MM') hasta el mes de `fromISO`, en orden ascendente. */
export function lastMonths(fromISO: string, n: number): string[] {
  const y = Number(fromISO.slice(0, 4))
  const m = Number(fromISO.slice(5, 7)) - 1
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
