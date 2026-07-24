import { useEffect, useMemo, useState } from 'react'
import { todayISO } from '../data/plan'
import { formatCOP, lastMonths, monthKey, monthLabel } from '../lib/finance'
import {
  ACCOUNT_KIND_META,
  useFinance,
  type AccountKind,
  type TxKind,
} from '../hooks/useFinance'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'

const KINDS: AccountKind[] = ['efectivo', 'ahorros', 'inversion', 'externa']
const DEFAULT_CATS: { name: string; kind: TxKind }[] = [
  { name: 'Comida', kind: 'gasto' },
  { name: 'Transporte', kind: 'gasto' },
  { name: 'Ocio', kind: 'gasto' },
  { name: 'Ropa', kind: 'gasto' },
  { name: 'Otros', kind: 'gasto' },
  { name: 'Mesada', kind: 'ingreso' },
  { name: 'Trabajo', kind: 'ingreso' },
  { name: 'Interés', kind: 'ingreso' },
]
const SEED_FLAG = 'mivida:finance-cats-seeded:v1'

function toNum(v: string): number {
  const x = parseFloat(v.replace(/[.,\s]/g, ''))
  return Number.isNaN(x) ? 0 : x
}

type Panel = 'account' | 'movement' | 'transfer' | 'monthly' | null

export function Finanzas() {
  const fin = useFinance()
  const { accounts, transactions, transfers, categories } = fin
  const iso = todayISO()
  const [panel, setPanel] = useState<Panel>(null)

  useEffect(() => {
    if (categories.length === 0 && !localStorage.getItem(SEED_FLAG)) {
      localStorage.setItem(SEED_FLAG, '1')
      for (const c of DEFAULT_CATS) fin.addCategory(c.name, c.kind)
    }
  }, [categories.length, fin])

  const thisMonth = monthKey(iso)
  const patrimonio = useMemo(() => accounts.filter((a) => a.kind !== 'externa').reduce((s, a) => s + a.balance, 0), [accounts])
  const monthGasto = useMemo(() => transactions.filter((t) => t.kind === 'gasto' && monthKey(t.date) === thisMonth).reduce((s, t) => s + t.amount, 0), [transactions, thisMonth])
  const monthIngreso = useMemo(() => transactions.filter((t) => t.kind === 'ingreso' && monthKey(t.date) === thisMonth).reduce((s, t) => s + t.amount, 0), [transactions, thisMonth])

  const months = useMemo(() => lastMonths(iso, 6), [iso])
  const gastoPorMes = useMemo(
    () =>
      months.map((m) => {
        const v = transactions.filter((t) => t.kind === 'gasto' && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0)
        return { label: monthLabel(m), value: v, display: v >= 1000 ? `${Math.round(v / 1000)}k` : String(v) }
      }),
    [months, transactions],
  )

  const gastoPorCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) if (t.kind === 'gasto' && monthKey(t.date) === thisMonth) map.set(t.category ?? 'Sin categoría', (map.get(t.category ?? 'Sin categoría') ?? 0) + t.amount)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [transactions, thisMonth])
  const maxCat = Math.max(...gastoPorCategoria.map(([, v]) => v), 1)

  const ahorroTrend = useMemo(() => {
    let acc = 0
    return months.map((m) => {
      const net = transactions.filter((t) => monthKey(t.date) === m).reduce((s, t) => s + (t.kind === 'ingreso' ? t.amount : -t.amount), 0)
      acc += net
      return { label: monthLabel(m), value: Math.round(acc / 1000) }
    })
  }, [months, transactions])

  const recent = useMemo(
    () =>
      [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [transactions],
  )

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Finanzas</h1>
        <p className="text-sm text-ink-500 mt-1">En pesos colombianos (COP).</p>
      </header>

      <div className="rounded-4xl bg-gradient-to-br from-ink-800 to-ink-900 text-white p-5 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Patrimonio</p>
        <p className="text-3xl font-bold font-display mt-0.5">{formatCOP(patrimonio)}</p>
        <div className="flex gap-5 mt-3">
          <div>
            <p className="text-sm font-semibold text-ok-300">{formatCOP(monthIngreso)}</p>
            <p className="text-[11px] text-white/60">ingresos del mes</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-300">{formatCOP(monthGasto)}</p>
            <p className="text-[11px] text-white/60">gastos del mes</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <ActionBtn label="+ Movimiento" active={panel === 'movement'} onClick={() => setPanel(panel === 'movement' ? null : 'movement')} />
        <ActionBtn label="⇄ Transferir" active={panel === 'transfer'} onClick={() => setPanel(panel === 'transfer' ? null : 'transfer')} />
        <ActionBtn label="+ Cuenta" active={panel === 'account'} onClick={() => setPanel(panel === 'account' ? null : 'account')} />
        <ActionBtn label="📅 Mesada/interés" active={panel === 'monthly'} onClick={() => setPanel(panel === 'monthly' ? null : 'monthly')} />
      </div>

      {panel === 'account' && <AccountForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'movement' && <MovementForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'transfer' && <TransferForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'monthly' && <MonthlyForm fin={fin} onDone={() => setPanel(null)} />}

      {/* Cuentas */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink-900">Cuentas</h2>
        {accounts.map((a) => (
          <div key={a.id} className="rounded-2xl bg-card shadow-card p-3 flex items-center gap-3">
            <span className="text-xl">{ACCOUNT_KIND_META[a.kind].emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900">{a.name}</p>
              <p className="text-xs text-ink-500">
                {ACCOUNT_KIND_META[a.kind].label}
                {a.interestPct ? ` · ${a.interestPct}%/mes` : ''}
              </p>
            </div>
            <p className="text-sm font-bold text-ink-900">{formatCOP(a.balance)}</p>
            <button onClick={() => fin.removeAccount(a.id)} className="text-xs text-ink-300 active:text-brand-600">✕</button>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-sm text-ink-500">Crea tu primera cuenta con "+ Cuenta".</p>}
      </section>

      {/* Gráficas */}
      {gastoPorMes.some((m) => m.value > 0) && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Gasto por mes</h2>
          <WeeklyBars bars={gastoPorMes} />
        </section>
      )}

      {gastoPorCategoria.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Gasto por categoría (este mes)</h2>
          <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
            {gastoPorCategoria.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-ink-800">{cat}</span>
                  <span className="font-semibold text-ink-900">{formatCOP(val)}</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(val / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {ahorroTrend.some((p) => p.value !== 0) && (
        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Evolución (neto acumulado)</h2>
          <TrendLine points={ahorroTrend} unit="miles de COP" decimals={0} />
        </section>
      )}

      {/* Movimientos recientes */}
      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-ink-900">Movimientos recientes</h2>
          {recent.map((t) => {
            const acc = accounts.find((a) => a.id === t.accountId)
            return (
              <div key={t.id} className="rounded-2xl bg-card shadow-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {t.description || t.category || (t.kind === 'gasto' ? 'Gasto' : 'Ingreso')}
                  </p>
                  <p className="text-xs text-ink-500">
                    {t.date}
                    {acc ? ` · ${acc.name}` : ''}
                    {t.sourceDetail ? ` · ${t.sourceDetail}` : ''}
                  </p>
                </div>
                <p className={`text-sm font-bold ${t.kind === 'ingreso' ? 'text-ok-600' : 'text-brand-600'}`}>
                  {t.kind === 'ingreso' ? '+' : '−'}{formatCOP(t.amount)}
                </p>
                <button onClick={() => fin.removeTransaction(t.id)} className="text-xs text-ink-300 active:text-brand-600">✕</button>
              </div>
            )
          })}
        </section>
      )}

      {transfers.length > 0 && (
        <p className="text-xs text-ink-400">{transfers.length} transferencia(s) registrada(s).</p>
      )}
    </div>
  )
}

function ActionBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-2xl py-2.5 text-sm font-semibold shadow-card ${active ? 'bg-brand-500 text-white' : 'bg-card text-ink-700'}`}>
      {label}
    </button>
  )
}

type Fin = ReturnType<typeof useFinance>

function inputCls() {
  return 'rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900'
}

function AccountForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AccountKind>('efectivo')
  const [balance, setBalance] = useState('')
  const [interest, setInterest] = useState('')
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (Personal, CDT Bancolombia…)" className={inputCls()} />
      <select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)} className={inputCls()}>
        {KINDS.map((k) => (
          <option key={k} value={k}>{ACCOUNT_KIND_META[k].label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="numeric" placeholder="Saldo inicial" className={`${inputCls()} flex-1`} />
        <input value={interest} onChange={(e) => setInterest(e.target.value)} inputMode="decimal" placeholder="% mensual" className={`${inputCls()} w-28`} />
      </div>
      <button
        onClick={() => {
          if (!name.trim()) return
          fin.addAccount({ name: name.trim(), kind, balance: toNum(balance), interestPct: interest ? parseFloat(interest.replace(',', '.')) : undefined })
          onDone()
        }}
        className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600"
      >
        Crear cuenta
      </button>
    </div>
  )
}

function MovementForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [kind, setKind] = useState<TxKind>('gasto')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(fin.accounts[0]?.id ?? '')
  const [category, setCategory] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const cats = fin.categories.filter((c) => c.kind === kind)
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        {(['gasto', 'ingreso'] as TxKind[]).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-full py-1.5 text-sm font-semibold capitalize ${kind === k ? (k === 'gasto' ? 'bg-brand-500 text-white' : 'bg-ok-500 text-white') : 'bg-ink-100 text-ink-500'}`}>
            {k}
          </button>
        ))}
      </div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="Monto (COP)" className={inputCls()} />
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls()}>
        <option value="">Sin cuenta</option>
        {fin.accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls()} flex-1`}>
          <option value="">Categoría…</option>
          {cats.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Origen" className={`${inputCls()} flex-1`} />
      </div>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" className={inputCls()} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls()} />
      <button
        onClick={() => {
          const amt = toNum(amount)
          if (amt <= 0) return
          fin.addTransaction({ date, amount: amt, kind, accountId: accountId || undefined, category: category || undefined, sourceDetail: source || undefined, description: description || undefined })
          onDone()
        }}
        className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600"
      >
        Guardar movimiento
      </button>
    </div>
  )
}

function TransferForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [from, setFrom] = useState(fin.accounts[0]?.id ?? '')
  const [to, setTo] = useState(fin.accounts[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls()}>
        <option value="">Desde…</option>
        {fin.accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls()}>
        <option value="">Hacia…</option>
        {fin.accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="Monto (COP)" className={inputCls()} />
      <button
        onClick={() => {
          const amt = toNum(amount)
          if (amt <= 0 || !from || !to || from === to) return
          fin.addTransfer({ date: todayISO(), fromAccountId: from, toAccountId: to, amount: amt })
          onDone()
        }}
        className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600"
      >
        Transferir
      </button>
    </div>
  )
}

function MonthlyForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [mesada, setMesada] = useState('50000')
  const [personal, setPersonal] = useState(fin.accounts[0]?.id ?? '')
  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <p className="text-sm text-ink-600">Añade la mesada a una cuenta y el interés mensual de cada cuenta de ahorro/CDT. Reversible (borra los movimientos para deshacer).</p>
      <div className="flex gap-2">
        <input value={mesada} onChange={(e) => setMesada(e.target.value)} inputMode="numeric" placeholder="Mesada" className={`${inputCls()} flex-1`} />
        <select value={personal} onChange={(e) => setPersonal(e.target.value)} className={`${inputCls()} flex-1`}>
          <option value="">Cuenta mesada…</option>
          {fin.accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => {
          fin.applyMonthly(toNum(mesada), personal || undefined)
          onDone()
        }}
        className="rounded-full bg-brand-500 text-white font-semibold py-2.5 active:bg-brand-600"
      >
        Aplicar mesada + intereses
      </button>
    </div>
  )
}
