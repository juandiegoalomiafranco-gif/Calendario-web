const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCOP(n: number): string {
  return COP.format(Math.round(n || 0))
}

const COP_CENTAVOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Igual que `formatCOP`, pero deja los centavos cuando los hay (saldos de banco). */
export function formatCOPExacto(n: number): string {
  const v = n || 0
  return Number.isInteger(v) ? formatCOP(v) : COP_CENTAVOS.format(v)
}

/**
 * Lee un monto escrito a la colombiana: «2.675.845,61», «17.157», «50000» o «1500.5».
 *
 * Antes se borraban todos los puntos y comas, así que «2.675.845,61» se guardaba como
 * 267.584.561: los centavos se volvían pesos. Ahora la coma es el decimal, y un punto
 * solo es decimal cuando no tiene la forma de separador de miles (grupos de tres).
 */
export function parseMonto(v: string): number {
  const limpio = v.replace(/[\s$]/g, '')
  if (!limpio) return 0
  let normal: string
  if (limpio.includes(',')) normal = limpio.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) normal = limpio.replace(/\./g, '')
  else normal = limpio
  const x = Number(normal)
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0
}

/**
 * Lo que rinde un saldo a una tasa **efectiva anual** (EA), la que anuncian los bancos
 * en Colombia («11 % EA»).
 *
 * Una tasa EA ya trae el interés compuesto adentro, así que el equivalente mensual NO
 * es 11 / 12: es (1 + 0,11)^(1/12) − 1 ≈ 0,8735 %. Dividir entre 12 daría de más.
 * Son cifras antes de la retención en la fuente, que el banco descuenta solo cuando
 * el rendimiento diario pasa del tope legal.
 */
export function rendimientoEA(saldo: number, tasaEA: number) {
  const r = (tasaEA || 0) / 100
  const tasaDiaria = Math.pow(1 + r, 1 / 365) - 1
  const tasaMensual = Math.pow(1 + r, 1 / 12) - 1
  return {
    diario: saldo * tasaDiaria,
    mensual: saldo * tasaMensual,
    anual: saldo * r,
    tasaMensualPct: tasaMensual * 100,
  }
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
