import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Pencil, Plus, Repeat, Tags, Wallet, X } from 'lucide-react'
import { todayIso } from '../lib/dates'
import {
  formatCOP,
  formatCOPExacto,
  lastMonths,
  monthKey,
  monthLabel,
  parseMonto,
  rendimientoEA,
} from '../lib/finance'
import {
  ACCOUNT_KIND_META,
  MONEY_SOURCE_META,
  useFinance,
  type Account,
  type AccountKind,
  type MoneySource,
  type TxKind,
} from '../hooks/useFinance'
import { WeeklyBars } from '../components/charts/WeeklyBars'
import { TrendLine } from '../components/charts/TrendLine'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Button } from '../components/ui/Button'
import { DateInput, Field, Select, TextInput } from '../components/ui/Field'
import { cx } from '../lib/cx'
import { DebtsCard } from '../components/finance/DebtsCard'
import { SCROLL_AREA_ID } from '../components/ScrollToTop'

const KINDS: AccountKind[] = ['efectivo', 'ahorros', 'inversion', 'externa']
const SOURCES: MoneySource[] = ['mia', 'papas']

const DEFAULT_CATS: { name: string; kind: TxKind }[] = [
  { name: 'Comida', kind: 'gasto' },
  { name: 'Salidas a comer', kind: 'gasto' },
  { name: 'Transporte', kind: 'gasto' },
  { name: 'Ocio', kind: 'gasto' },
  { name: 'Ropa', kind: 'gasto' },
  { name: 'Colegio / útiles', kind: 'gasto' },
  { name: 'Deporte', kind: 'gasto' },
  { name: 'Salud', kind: 'gasto' },
  { name: 'Regalos', kind: 'gasto' },
  { name: 'Suscripciones', kind: 'gasto' },
  { name: 'Otros', kind: 'gasto' },
  { name: 'Mesada', kind: 'ingreso' },
  { name: 'Trabajo', kind: 'ingreso' },
  { name: 'Interés', kind: 'ingreso' },
  { name: 'Regalo', kind: 'ingreso' },
]
const SEED_FLAG = 'mivida:finance-cats-seeded:v2'

/** Cuentas con las que arranca la app; los saldos los pone él. */
const DEFAULT_ACCOUNTS: { name: string; kind: AccountKind }[] = [
  { name: 'Efectivo', kind: 'efectivo' },
  { name: 'Cuenta de ahorros', kind: 'ahorros' },
  { name: 'CDT / inversión', kind: 'inversion' },
]
const ACCOUNTS_SEED_FLAG = 'mivida:finance-accounts-seeded:v1'

/** Montos escritos a mano: «2.675.845,61» guarda sus centavos (ver `parseMonto`). */
const toNum = parseMonto

type Panel = 'account' | 'movement' | 'transfer' | 'monthly' | 'categories' | null

const PANELS = [
  { id: 'movement' as const, label: 'Movimiento', Icon: Plus },
  { id: 'transfer' as const, label: 'Transferir', Icon: ArrowLeftRight },
  { id: 'account' as const, label: 'Cuenta', Icon: Wallet },
  { id: 'categories' as const, label: 'Categorías', Icon: Tags },
  { id: 'monthly' as const, label: 'Mesada / interés', Icon: Repeat },
]

export function Finanzas() {
  const fin = useFinance()
  const { accounts, transactions, transfers, categories } = fin
  const iso = todayIso()
  const [panel, setPanel] = useState<Panel>(null)
  /** Cuenta que se está editando (saldo, nombre o tasa). */
  const [editing, setEditing] = useState<Account | null>(null)
  /** Con qué plata mirar el desglose: la mía, la de mis papás o todo junto. */
  const [catSource, setCatSource] = useState<MoneySource | 'todo'>('todo')

  useEffect(() => {
    if (categories.length === 0 && !localStorage.getItem(SEED_FLAG)) {
      localStorage.setItem(SEED_FLAG, '1')
      for (const c of DEFAULT_CATS) fin.addCategory(c.name, c.kind)
    }
  }, [categories.length, fin])

  useEffect(() => {
    if (accounts.length === 0 && !localStorage.getItem(ACCOUNTS_SEED_FLAG)) {
      localStorage.setItem(ACCOUNTS_SEED_FLAG, '1')
      for (const a of DEFAULT_ACCOUNTS) fin.addAccount({ ...a, balance: 0 })
    }
  }, [accounts.length, fin])

  const thisMonth = monthKey(iso)
  /** Suma de lo que rinden todas las cuentas con tasa, al día, al mes y al año. */
  const rendimientoTotal = useMemo(() => {
    const total = { diario: 0, mensual: 0, anual: 0 }
    for (const a of accounts) {
      if (!a.interestPct || a.kind === 'externa') continue
      const r = rendimientoEA(a.balance, a.interestPct)
      total.diario += r.diario
      total.mensual += r.mensual
      total.anual += r.anual
    }
    return total
  }, [accounts])
  const patrimonio = useMemo(
    () => accounts.filter((a) => a.kind !== 'externa').reduce((s, a) => s + a.balance, 0),
    [accounts],
  )
  /** Gasto del mes separado por fuente: es la cifra que él quiere ver aparte. */
  const { monthGastoMio, monthGastoPapas } = useMemo(() => {
    let mio = 0
    let papas = 0
    for (const t of transactions) {
      if (t.kind !== 'gasto' || monthKey(t.date) !== thisMonth) continue
      if (t.source === 'papas') papas += t.amount
      else mio += t.amount
    }
    return { monthGastoMio: mio, monthGastoPapas: papas }
  }, [transactions, thisMonth])
  const monthIngreso = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.kind === 'ingreso' && monthKey(t.date) === thisMonth && t.source === 'mia',
        )
        .reduce((s, t) => s + t.amount, 0),
    [transactions, thisMonth],
  )

  const months = useMemo(() => lastMonths(iso, 6), [iso])
  const gastoPorMes = useMemo(
    () =>
      months.map((m) => {
        const v = transactions
          .filter((t) => t.kind === 'gasto' && monthKey(t.date) === m)
          .reduce((s, t) => s + t.amount, 0)
        return {
          label: monthLabel(m),
          value: v,
          display: v >= 1000 ? `${Math.round(v / 1000)}k` : String(v),
        }
      }),
    [months, transactions],
  )

  const gastoPorCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.kind !== 'gasto' || monthKey(t.date) !== thisMonth) continue
      if (catSource !== 'todo' && t.source !== catSource) continue
      const key = t.category ?? 'Sin categoría'
      map.set(key, (map.get(key) ?? 0) + t.amount)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [transactions, thisMonth, catSource])
  const maxCat = Math.max(...gastoPorCategoria.map(([, v]) => v), 1)

  const ahorroTrend = useMemo(() => {
    let acc = 0
    return months.map((m) => {
      // Solo la plata propia: la de los papás no entra ni sale de tu patrimonio.
      const net = transactions
        .filter((t) => monthKey(t.date) === m && t.source === 'mia')
        .reduce((s, t) => s + (t.kind === 'ingreso' ? t.amount : -t.amount), 0)
      acc += net
      return { label: monthLabel(m), value: Math.round(acc / 1000) }
    })
  }, [months, transactions])

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [transactions],
  )

  const hasCharts =
    gastoPorMes.some((m) => m.value > 0) || ahorroTrend.some((p) => p.value !== 0)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Finanzas"
        description="En pesos colombianos (COP)."
        actions={PANELS.map(({ id, label, Icon }) => (
          <Button
            key={id}
            variant={panel === id ? 'primary' : 'outline'}
            onClick={() => setPanel(panel === id ? null : id)}
          >
            <Icon size={16} aria-hidden />
            {label}
          </Button>
        ))}
      />

      {panel === 'account' && <AccountForm fin={fin} onDone={() => setPanel(null)} />}
      {editing && (
        <AccountForm key={editing.id} fin={fin} initial={editing} onDone={() => setEditing(null)} />
      )}
      {panel === 'movement' && <MovementForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'transfer' && <TransferForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'monthly' && <MonthlyForm fin={fin} onDone={() => setPanel(null)} />}
      {panel === 'categories' && <CategoriesPanel fin={fin} />}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="rounded-[22px] bg-hero-to p-5 text-hero-fg lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-hero-fg/70">
            Patrimonio
          </p>
          <p className="mt-0.5 text-3xl font-semibold tabular tracking-tight lg:text-4xl">
            {formatCOP(patrimonio)}
          </p>
          <p className="mt-0.5 text-[11px] text-hero-fg/55">
            Solo tu plata. Lo que pagan tus papás se lleva aparte.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <p className="text-lg font-bold tabular text-hero-ok">{formatCOP(monthIngreso)}</p>
              <p className="text-[11px] text-hero-fg/65">entró este mes</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular text-hero-danger">
                {formatCOP(monthGastoMio)}
              </p>
              <p className="text-[11px] text-hero-fg/65">gasté de mi plata</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular text-hero-fg/90">
                {formatCOP(monthGastoPapas)}
              </p>
              <p className="text-[11px] text-hero-fg/65">gasté de mis papás</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular text-hero-fg">
                {formatCOP(monthIngreso - monthGastoMio)}
              </p>
              <p className="text-[11px] text-hero-fg/65">neto del mes</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Cuentas"
            action={
              <span className="text-xs text-content-subtle">
                {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
              </span>
            }
          />
          {accounts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {accounts.map((a) => {
                const meta = ACCOUNT_KIND_META[a.kind]
                const rinde = a.interestPct ? rendimientoEA(a.balance, a.interestPct) : null
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <span
                      className={cx(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                        meta.color.soft,
                      )}
                    >
                      <meta.Icon size={17} strokeWidth={2} aria-hidden />
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(a)
                        // El formulario sale arriba; sin esto, en el celular quedaba fuera de vista.
                        document.getElementById(SCROLL_AREA_ID)?.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      aria-label={`Editar ${a.name}`}
                      className="flex min-w-0 flex-1 flex-col text-left"
                    >
                      {/* Nombre y saldo arriba; la tasa y lo que rinde debajo, a todo el ancho:
                          al lado del saldo no cabían en el celular y se cortaban. */}
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-content">
                          {a.name}
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular text-content">
                          {formatCOPExacto(a.balance)}
                        </span>
                        <Pencil size={13} className="shrink-0 text-content-subtle" aria-hidden />
                      </span>
                      <span className="text-xs text-content-muted">
                        {meta.label}
                        {a.interestPct ? ` · ${a.interestPct} % EA` : ''}
                      </span>
                      {rinde && rinde.diario > 0 && (
                        <span className="text-xs font-medium text-ok">
                          Rinde ≈ {formatCOP(rinde.diario)} al día · {formatCOP(rinde.mensual)} al mes
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => fin.removeAccount(a.id)}
                      aria-label={`Borrar ${a.name}`}
                      className="shrink-0 text-content-subtle transition-colors hover:text-danger"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-content-muted">Crea tu primera cuenta con «Cuenta».</p>
          )}
          {rendimientoTotal.anual > 0 && (
            <div className="mt-3 rounded-2xl bg-ok-soft p-3">
              <p className="text-xs font-semibold text-ok">Lo que rinden tus ahorros</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold tabular text-content">
                    {formatCOP(rendimientoTotal.diario)}
                  </p>
                  <p className="text-[11px] text-content-muted">al día</p>
                </div>
                <div>
                  <p className="text-sm font-bold tabular text-content">
                    {formatCOP(rendimientoTotal.mensual)}
                  </p>
                  <p className="text-[11px] text-content-muted">al mes</p>
                </div>
                <div>
                  <p className="text-sm font-bold tabular text-content">
                    {formatCOP(rendimientoTotal.anual)}
                  </p>
                  <p className="text-[11px] text-content-muted">al año</p>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-content-muted">
                Con la tasa EA de cada cuenta y el saldo de hoy, antes de retención.
              </p>
            </div>
          )}
        </Card>
      </div>

      <DebtsCard fin={fin} />

      {hasCharts && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          {gastoPorMes.some((m) => m.value > 0) && (
            <Card>
              <CardHeader title="Gasto por mes" />
              <WeeklyBars bars={gastoPorMes} />
            </Card>
          )}
          {ahorroTrend.some((p) => p.value !== 0) && (
            <Card>
              <CardHeader title="Evolución (neto acumulado)" />
              <TrendLine points={ahorroTrend} unit="miles de COP" decimals={0} />
            </Card>
          )}
        </div>
      )}

      {(transactions.length > 0 || recent.length > 0) && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          {transactions.length > 0 && (
            <Card>
              <CardHeader
                title="Gasto por categoría"
                action={
                  <SegmentedControl
                    options={[
                      { value: 'todo', label: 'Todo' },
                      { value: 'mia', label: 'Mía' },
                      { value: 'papas', label: 'Papás' },
                    ]}
                    value={catSource}
                    onChange={(v) => setCatSource(v as MoneySource | 'todo')}
                    ariaLabel="Con qué plata"
                  />
                }
              />
              <div className="flex flex-col gap-3">
                {gastoPorCategoria.map(([cat, val]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-content">{cat}</span>
                      <span className="shrink-0 font-semibold tabular text-content">
                        {formatCOP(val)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(val / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {recent.length > 0 && (
            <Card>
              <CardHeader title="Movimientos recientes" />
              <div className="flex flex-col">
                {recent.map((t) => {
                  const acc = accounts.find((a) => a.id === t.accountId)
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 border-b border-line py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content">
                          {t.description || t.category || (t.kind === 'gasto' ? 'Gasto' : 'Ingreso')}
                        </p>
                        <p className="truncate text-xs text-content-muted">
                          {t.date}
                          {t.source === 'papas' ? ' · Papás' : acc ? ` · ${acc.name}` : ''}
                          {t.sourceDetail ? ` · ${t.sourceDetail}` : ''}
                        </p>
                      </div>
                      <p
                        className={cx(
                          'shrink-0 text-sm font-bold tabular',
                          t.kind === 'ingreso' ? 'text-ok' : 'text-danger',
                        )}
                      >
                        {t.kind === 'ingreso' ? '+' : '−'}
                        {formatCOP(t.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => fin.removeTransaction(t.id)}
                        aria-label="Borrar movimiento"
                        className="shrink-0 text-content-subtle transition-colors hover:text-danger"
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </div>
                  )
                })}
              </div>
              {transfers.length > 0 && (
                <p className="mt-3 text-xs text-content-subtle">
                  {transfers.length} transferencia(s) registrada(s).
                </p>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

type Fin = ReturnType<typeof useFinance>

/** Envoltorio común de los formularios de finanzas. */
function FormCard({
  title,
  hint,
  submit,
  onSubmit,
  children,
}: {
  title: string
  hint?: string
  submit: string
  onSubmit: () => void
  children: React.ReactNode
}) {
  return (
    <Card padding="lg">
      <CardHeader title={title} />
      {hint && <p className="mb-3 text-sm text-content-muted">{hint}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
      <Button variant="primary" size="lg" onClick={onSubmit} className="mt-4">
        {submit}
      </Button>
    </Card>
  )
}

/** Crear una cuenta o, con `initial`, corregir su nombre, saldo o tasa. */
function AccountForm({
  fin,
  onDone,
  initial,
}: {
  fin: Fin
  onDone: () => void
  initial?: Account
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'efectivo')
  const [balance, setBalance] = useState(
    initial ? String(initial.balance).replace('.', ',') : '',
  )
  const [interest, setInterest] = useState(
    initial?.interestPct != null ? String(initial.interestPct).replace('.', ',') : '',
  )

  return (
    <FormCard
      title={initial ? `Editar ${initial.name}` : 'Nueva cuenta'}
      hint={
        initial
          ? 'Cambiar el saldo aquí no crea un movimiento: úsalo para cuadrar con lo que dice el banco.'
          : undefined
      }
      submit={initial ? 'Guardar cambios' : 'Crear cuenta'}
      onSubmit={() => {
        if (!name.trim()) return
        const tasa = interest.trim() ? Number(interest.replace(',', '.')) : undefined
        const datos = {
          name: name.trim(),
          kind,
          balance: toNum(balance),
          interestPct: tasa && Number.isFinite(tasa) && tasa > 0 ? tasa : undefined,
        }
        if (initial) fin.updateAccount({ ...initial, ...datos })
        else fin.addAccount(datos)
        onDone()
      }}
    >
      <Field label="Nombre">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Personal, CDT Bancolombia…"
        />
      </Field>
      <Field label="Tipo">
        <Select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {ACCOUNT_KIND_META[k].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={initial ? 'Saldo' : 'Saldo inicial'} hint="Con centavos: 2.675.845,61">
        <TextInput
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          inputMode="decimal"
          placeholder="0"
        />
      </Field>
      <Field label="Interés (% EA)" hint="La tasa efectiva anual que da el banco: 11">
        <TextInput
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          inputMode="decimal"
          placeholder="0"
        />
      </Field>
    </FormCard>
  )
}

function MovementForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [kind, setKind] = useState<TxKind>('gasto')
  const [source, setSource] = useState<MoneySource>('mia')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(fin.accounts[0]?.id ?? '')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [detail, setDetail] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayIso())
  const cats = fin.categories.filter((c) => c.kind === kind)

  function crearCategoria() {
    const clean = newCategory.trim()
    if (!clean) return
    fin.addCategory(clean, kind)
    setCategory(clean)
    setNewCategory('')
    setAddingCat(false)
  }

  return (
    <Card padding="lg">
      <CardHeader
        title="Nuevo movimiento"
        action={
          <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-1">
            {(['gasto', 'ingreso'] as TxKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k)
                  setCategory('')
                  if (k === 'ingreso') setSource('mia')
                }}
                aria-pressed={kind === k}
                className={cx(
                  'h-8 rounded-full px-3.5 text-[13px] font-semibold capitalize transition-colors',
                  kind === k
                    ? k === 'gasto'
                      ? 'bg-danger-soft text-danger'
                      : 'bg-ok-soft text-ok'
                    : 'text-content-muted hover:text-content',
                )}
              >
                {k}
              </button>
            ))}
          </div>
        }
      />

      {/* Lo primero: de quién es la plata. De eso depende si toca tus saldos. */}
      {kind === 'gasto' && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold text-content-muted">¿Con qué plata?</p>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setSource(sc)}
                aria-pressed={source === sc}
                className={cx(
                  'flex min-h-[52px] flex-col items-center justify-center rounded-2xl text-[13px] font-bold transition-colors',
                  source === sc
                    ? 'bg-primary text-primary-on'
                    : 'bg-surface-2 text-content-muted hover:text-content',
                )}
              >
                {MONEY_SOURCE_META[sc].label}
                <span className="text-[10px] font-medium opacity-70">
                  {sc === 'mia' ? 'baja tu saldo' : 'no toca tu plata'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Monto (COP)">
          <TextInput
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="0"
          />
        </Field>

        {source === 'mia' ? (
          <Field label="Cuenta">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Sin cuenta</option>
              {fin.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="¿Cómo pagaron?" hint="Opcional: tarjeta de papá, efectivo, Nequi de mamá…">
            <TextInput
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Tarjeta de papá"
            />
          </Field>
        )}

        <Field label="Categoría">
          {addingCat ? (
            <div className="flex gap-1.5">
              <TextInput
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && crearCategoria()}
                placeholder="Salidas a comer"
                autoFocus
              />
              <Button variant="primary" onClick={crearCategoria}>
                Crear
              </Button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1"
              >
                <option value="">Sin categoría</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAddingCat(true)}
                aria-label="Crear categoría nueva"
                title="Crear categoría nueva"
              >
                <Plus size={16} aria-hidden />
              </Button>
            </div>
          )}
        </Field>

        <Field label="Descripción">
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Fecha">
          <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="mt-4"
        onClick={() => {
          const amt = toNum(amount)
          if (amt <= 0) return
          fin.addTransaction({
            date,
            amount: amt,
            kind,
            source: kind === 'ingreso' ? 'mia' : source,
            accountId: source === 'mia' ? accountId || undefined : undefined,
            category: category || undefined,
            sourceDetail: source === 'papas' ? detail || undefined : undefined,
            description: description || undefined,
          })
          onDone()
        }}
      >
        Guardar movimiento
      </Button>
    </Card>
  )
}

/** Crear, renombrar y borrar las categorías de gasto y de ingreso. */
function CategoriesPanel({ fin }: { fin: Fin }) {
  const [kind, setKind] = useState<TxKind>('gasto')
  const [nueva, setNueva] = useState('')
  const cats = fin.categories.filter((c) => c.kind === kind)

  return (
    <Card padding="lg">
      <CardHeader
        title="Categorías"
        action={
          <SegmentedControl
            options={[
              { value: 'gasto', label: 'Gastos' },
              { value: 'ingreso', label: 'Ingresos' },
            ]}
            value={kind}
            onChange={(v) => setKind(v as TxKind)}
            ariaLabel="Tipo de categoría"
          />
        }
      />

      <div className="mb-3 flex gap-1.5">
        <TextInput
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            fin.addCategory(nueva, kind)
            setNueva('')
          }}
          placeholder={kind === 'gasto' ? 'Salidas a comer' : 'Regalo'}
        />
        <Button
          variant="primary"
          onClick={() => {
            fin.addCategory(nueva, kind)
            setNueva('')
          }}
        >
          Añadir
        </Button>
      </div>

      <div className="flex flex-col">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
            <TextInput
              value={c.name}
              onChange={(e) => fin.renameCategory(c.id, e.target.value)}
              aria-label={`Nombre de ${c.name}`}
              className="flex-1 border-transparent bg-transparent px-1"
            />
            <button
              type="button"
              onClick={() => fin.removeCategory(c.id)}
              aria-label={`Borrar ${c.name}`}
              className="shrink-0 text-content-subtle transition-colors hover:text-danger"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
        {cats.length === 0 && (
          <p className="text-sm text-content-muted">Todavía no hay categorías de este tipo.</p>
        )}
      </div>

      <p className="mt-3 text-xs text-content-subtle">
        Borrar una categoría no borra los movimientos que ya la usaban: siguen con su nombre.
      </p>
    </Card>
  )
}

function TransferForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [from, setFrom] = useState(fin.accounts[0]?.id ?? '')
  const [to, setTo] = useState(fin.accounts[1]?.id ?? '')
  const [amount, setAmount] = useState('')

  return (
    <FormCard
      title="Transferir entre cuentas"
      submit="Transferir"
      onSubmit={() => {
        const amt = toNum(amount)
        if (amt <= 0 || !from || !to || from === to) return
        fin.addTransfer({ date: todayIso(), fromAccountId: from, toAccountId: to, amount: amt })
        onDone()
      }}
    >
      <Field label="Desde">
        <Select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Elige cuenta…</option>
          {fin.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Hacia">
        <Select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Elige cuenta…</option>
          {fin.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Monto (COP)">
        <TextInput
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="0"
        />
      </Field>
    </FormCard>
  )
}

function MonthlyForm({ fin, onDone }: { fin: Fin; onDone: () => void }) {
  const [mesada, setMesada] = useState('50000')
  const [personal, setPersonal] = useState(fin.accounts[0]?.id ?? '')

  return (
    <FormCard
      title="Mesada e intereses"
      hint="Añade la mesada a una cuenta y el interés de un mes de cada cuenta de ahorro o CDT, calculado con su tasa EA. Es reversible: borra los movimientos para deshacer."
      submit="Aplicar mesada + intereses"
      onSubmit={() => {
        fin.applyMonthly(toNum(mesada), personal || undefined)
        onDone()
      }}
    >
      <Field label="Mesada (COP)">
        <TextInput
          value={mesada}
          onChange={(e) => setMesada(e.target.value)}
          inputMode="numeric"
        />
      </Field>
      <Field label="Cuenta de la mesada">
        <Select value={personal} onChange={(e) => setPersonal(e.target.value)}>
          <option value="">Elige cuenta…</option>
          {fin.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>
    </FormCard>
  )
}
