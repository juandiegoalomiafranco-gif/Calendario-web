import { describe, expect, it } from 'vitest'
import type { Account, Budget, Goal, Transaction } from '../data/types'
import {
  accountBalance,
  accountsWithBalance,
  budgetStatus,
  expenseByCategory,
  expenseByMonth,
  goalProgress,
  goalsByUrgency,
  monthSummary,
  netWorth,
  netWorthByMonth,
} from './finanzas'

const NOW = '2026-09-12T10:00:00.000Z'

function account(over: Partial<Account> & { id: string }): Account {
  return {
    name: 'Cuenta',
    kind: 'banco',
    initialBalance: 0,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

function tx(over: Partial<Transaction> & { id: string; accountId: string }): Transaction {
  return {
    type: 'gasto',
    amount: 0,
    date: '2026-09-01',
    category: 'otros-gastos',
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

describe('accountBalance', () => {
  const banco = account({ id: 'a1', initialBalance: 1_000_000 })

  it('parte del saldo inicial cuando no hay movimientos', () => {
    expect(accountBalance(banco, [])).toBe(1_000_000)
  })

  it('suma ingresos y resta gastos de la cuenta', () => {
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', type: 'ingreso', amount: 500_000 }),
      tx({ id: 't2', accountId: 'a1', type: 'gasto', amount: 200_000 }),
    ]
    expect(accountBalance(banco, movimientos)).toBe(1_300_000)
  })

  it('ignora los movimientos de otras cuentas', () => {
    const movimientos = [tx({ id: 't1', accountId: 'otra', type: 'gasto', amount: 900_000 })]
    expect(accountBalance(banco, movimientos)).toBe(1_000_000)
  })

  it('resta la transferencia en el origen y la suma en el destino', () => {
    const ahorro = account({ id: 'a2', kind: 'ahorro', initialBalance: 0 })
    const transferencia = [
      tx({
        id: 't1',
        accountId: 'a1',
        toAccountId: 'a2',
        type: 'transferencia',
        amount: 300_000,
        category: 'transferencia',
      }),
    ]
    expect(accountBalance(banco, transferencia)).toBe(700_000)
    expect(accountBalance(ahorro, transferencia)).toBe(300_000)
  })
})

describe('netWorth', () => {
  it('suma los saldos de las cuentas activas', () => {
    const cuentas = [
      account({ id: 'a1', initialBalance: 1_000_000 }),
      account({ id: 'a2', kind: 'efectivo', initialBalance: 250_000 }),
    ]
    expect(netWorth(cuentas, [])).toBe(1_250_000)
  })

  it('excluye las cuentas archivadas', () => {
    const cuentas = [
      account({ id: 'a1', initialBalance: 1_000_000 }),
      account({ id: 'a2', initialBalance: 500_000, archived: true }),
    ]
    expect(netWorth(cuentas, [])).toBe(1_000_000)
  })

  it('resta el saldo de la tarjeta de crédito, que es deuda', () => {
    const cuentas = [
      account({ id: 'a1', initialBalance: 2_000_000 }),
      account({ id: 'a2', kind: 'tarjeta', initialBalance: 400_000 }),
    ]
    expect(netWorth(cuentas, [])).toBe(1_600_000)
  })

  it('no cambia con una transferencia entre cuentas propias', () => {
    const cuentas = [
      account({ id: 'a1', initialBalance: 1_000_000 }),
      account({ id: 'a2', kind: 'ahorro', initialBalance: 0 }),
    ]
    const antes = netWorth(cuentas, [])
    const despues = netWorth(cuentas, [
      tx({
        id: 't1',
        accountId: 'a1',
        toAccountId: 'a2',
        type: 'transferencia',
        amount: 400_000,
        category: 'transferencia',
      }),
    ])
    expect(despues).toBe(antes)
  })
})

describe('accountsWithBalance', () => {
  it('devuelve las activas ordenadas de mayor a menor saldo', () => {
    const cuentas = [
      account({ id: 'a1', name: 'Chica', initialBalance: 100_000 }),
      account({ id: 'a2', name: 'Grande', initialBalance: 900_000 }),
      account({ id: 'a3', name: 'Vieja', initialBalance: 999_999, archived: true }),
    ]
    expect(accountsWithBalance(cuentas, []).map((a) => a.name)).toEqual(['Grande', 'Chica'])
  })
})

describe('monthSummary', () => {
  const movimientos = [
    tx({ id: 't1', accountId: 'a1', type: 'ingreso', amount: 3_000_000, date: '2026-09-01' }),
    tx({ id: 't2', accountId: 'a1', type: 'gasto', amount: 800_000, date: '2026-09-15' }),
    tx({ id: 't3', accountId: 'a1', type: 'gasto', amount: 100_000, date: '2026-08-31' }),
  ]

  it('solo cuenta el mes pedido', () => {
    expect(monthSummary(movimientos, '2026-09')).toEqual({
      income: 3_000_000,
      expense: 800_000,
      net: 2_200_000,
    })
  })

  it('deja las transferencias fuera: mueven plata, no la generan ni la gastan', () => {
    const conTransferencia = [
      ...movimientos,
      tx({
        id: 't4',
        accountId: 'a1',
        toAccountId: 'a2',
        type: 'transferencia',
        amount: 500_000,
        date: '2026-09-10',
        category: 'transferencia',
      }),
    ]
    expect(monthSummary(conTransferencia, '2026-09').expense).toBe(800_000)
  })

  it('devuelve ceros para un mes sin movimientos', () => {
    expect(monthSummary(movimientos, '2026-01')).toEqual({ income: 0, expense: 0, net: 0 })
  })
})

describe('expenseByCategory', () => {
  it('agrupa y ordena de mayor a menor', () => {
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', amount: 50_000, category: 'mercado', date: '2026-09-02' }),
      tx({ id: 't2', accountId: 'a1', amount: 30_000, category: 'transporte', date: '2026-09-03' }),
      tx({ id: 't3', accountId: 'a1', amount: 70_000, category: 'mercado', date: '2026-09-04' }),
    ]
    expect(expenseByCategory(movimientos, '2026-09')).toEqual([
      { category: 'mercado', total: 120_000 },
      { category: 'transporte', total: 30_000 },
    ])
  })

  it('no incluye ingresos', () => {
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', type: 'ingreso', amount: 9_000_000, category: 'salario' }),
    ]
    expect(expenseByCategory(movimientos, '2026-09')).toEqual([])
  })
})

describe('expenseByMonth', () => {
  it('respeta el orden de los meses pedidos, con 0 en los vacíos', () => {
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', amount: 100_000, date: '2026-07-05' }),
      tx({ id: 't2', accountId: 'a1', amount: 300_000, date: '2026-09-05' }),
    ]
    expect(expenseByMonth(movimientos, ['2026-07', '2026-08', '2026-09'])).toEqual([
      100_000, 0, 300_000,
    ])
  })
})

describe('budgetStatus', () => {
  function budget(category: string, monthlyLimit: number): Budget & { id: string } {
    return { id: category, category, monthlyLimit, updatedAt: NOW }
  }

  it('calcula lo gastado, lo que queda y la fracción', () => {
    const presupuestos = [budget('mercado', 400_000)]
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', amount: 100_000, category: 'mercado', date: '2026-09-02' }),
    ]
    const [mercado] = budgetStatus(presupuestos, movimientos, '2026-09')
    expect(mercado.spent).toBe(100_000)
    expect(mercado.remaining).toBe(300_000)
    expect(mercado.fraction).toBeCloseTo(0.25)
    expect(mercado.over).toBe(false)
  })

  it('marca el exceso con remaining negativo', () => {
    const presupuestos = [budget('ocio', 100_000)]
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', amount: 150_000, category: 'ocio', date: '2026-09-02' }),
    ]
    const [ocio] = budgetStatus(presupuestos, movimientos, '2026-09')
    expect(ocio.over).toBe(true)
    expect(ocio.remaining).toBe(-50_000)
    expect(ocio.fraction).toBeCloseTo(1.5)
  })

  it('deja fuera los límites en cero', () => {
    expect(budgetStatus([budget('ropa', 0)], [], '2026-09')).toEqual([])
  })

  it('ordena primero la categoría más consumida', () => {
    const presupuestos = [budget('mercado', 1_000_000), budget('ocio', 100_000)]
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', amount: 100_000, category: 'mercado', date: '2026-09-02' }),
      tx({ id: 't2', accountId: 'a1', amount: 90_000, category: 'ocio', date: '2026-09-02' }),
    ]
    expect(budgetStatus(presupuestos, movimientos, '2026-09').map((b) => b.category)).toEqual([
      'ocio',
      'mercado',
    ])
  })
})

describe('goalProgress', () => {
  function goal(over: Partial<Goal> & { id: string }): Goal {
    return {
      name: 'Meta',
      targetAmount: 1_000_000,
      savedAmount: 0,
      createdAt: NOW,
      updatedAt: NOW,
      ...over,
    }
  }

  it('usa el monto anotado a mano cuando no hay cuenta ligada', () => {
    const p = goalProgress(goal({ id: 'g1', savedAmount: 250_000 }), [], [], '2026-09-12')
    expect(p.saved).toBe(250_000)
    expect(p.remaining).toBe(750_000)
    expect(p.fraction).toBeCloseTo(0.25)
    expect(p.done).toBe(false)
  })

  it('lee el saldo de la cuenta ligada', () => {
    const ahorro = account({ id: 'a1', kind: 'ahorro', initialBalance: 400_000 })
    const p = goalProgress(goal({ id: 'g1', accountId: 'a1' }), [ahorro], [], '2026-09-12')
    expect(p.saved).toBe(400_000)
  })

  it('marca la meta cumplida y no pide ahorro mensual', () => {
    const p = goalProgress(
      goal({ id: 'g1', savedAmount: 1_200_000, targetDate: '2026-12-31' }),
      [],
      [],
      '2026-09-12',
    )
    expect(p.done).toBe(true)
    expect(p.remaining).toBe(0)
    expect(p.fraction).toBe(1)
    expect(p.monthlyNeeded).toBeNull()
  })

  it('reparte lo que falta entre los meses que quedan', () => {
    const p = goalProgress(
      goal({ id: 'g1', targetAmount: 900_000, targetDate: '2026-12-12' }),
      [],
      [],
      '2026-09-12',
    )
    // De septiembre a diciembre quedan 3 meses completos.
    expect(p.monthlyNeeded).toBe(300_000)
  })

  it('sin meses por delante pide todo lo que falta de una, no Infinity', () => {
    const p = goalProgress(
      goal({ id: 'g1', targetAmount: 500_000, targetDate: '2026-09-30' }),
      [],
      [],
      '2026-09-12',
    )
    expect(p.monthlyNeeded).toBe(500_000)
    expect(Number.isFinite(p.monthlyNeeded)).toBe(true)
  })

  it('marca vencida una meta con fecha pasada sin cumplir', () => {
    const p = goalProgress(
      goal({ id: 'g1', targetDate: '2026-06-01' }),
      [],
      [],
      '2026-09-12',
    )
    expect(p.overdue).toBe(true)
  })

  it('no marca vencida una meta cumplida con fecha pasada', () => {
    const p = goalProgress(
      goal({ id: 'g1', savedAmount: 1_000_000, targetDate: '2026-06-01' }),
      [],
      [],
      '2026-09-12',
    )
    expect(p.overdue).toBe(false)
  })
})

describe('goalsByUrgency', () => {
  it('pone primero la fecha más cercana y manda las cumplidas al final', () => {
    const base = { savedAmount: 0, createdAt: NOW, updatedAt: NOW, targetAmount: 100_000 }
    const metas: Goal[] = [
      { ...base, id: 'g1', name: 'Lejana', targetDate: '2027-01-01' },
      { ...base, id: 'g2', name: 'Sin fecha' },
      { ...base, id: 'g3', name: 'Cercana', targetDate: '2026-10-01' },
      { ...base, id: 'g4', name: 'Cumplida', savedAmount: 100_000, targetDate: '2026-09-20' },
    ]
    expect(goalsByUrgency(metas, [], [], '2026-09-12').map((p) => p.goal.name)).toEqual([
      'Cercana',
      'Lejana',
      'Sin fecha',
      'Cumplida',
    ])
  })
})

describe('netWorthByMonth', () => {
  it('acumula hasta el cierre de cada mes y termina en el patrimonio actual', () => {
    const cuentas = [account({ id: 'a1', initialBalance: 1_000_000 })]
    const movimientos = [
      tx({ id: 't1', accountId: 'a1', type: 'ingreso', amount: 500_000, date: '2026-08-10' }),
      tx({ id: 't2', accountId: 'a1', type: 'gasto', amount: 200_000, date: '2026-09-10' }),
    ]
    const serie = netWorthByMonth(cuentas, movimientos, ['2026-07', '2026-08', '2026-09'])
    expect(serie).toEqual([1_000_000, 1_500_000, 1_300_000])
    expect(serie[serie.length - 1]).toBe(netWorth(cuentas, movimientos))
  })
})
