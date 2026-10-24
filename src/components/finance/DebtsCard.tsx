import { useMemo, useState } from 'react'
import { Check, ChevronDown, Plus, RotateCcw, X } from 'lucide-react'
import {
  DEBT_DIRECTION_META,
  useFinance,
  type Debt,
  type DebtDirection,
} from '../../hooks/useFinance'
import { daysBetween, formatDayMonth, todayIso } from '../../lib/dates'
import { formatCOP, parseMonto } from '../../lib/finance'
import { cx } from '../../lib/cx'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { SegmentedControl } from '../ui/SegmentedControl'
import { DateInput, Field, Select, TextInput } from '../ui/Field'

type Fin = ReturnType<typeof useFinance>

/** «vence en 3 días», «vencida hace 2 días»… con el tono de urgencia que toca. */
function vencimiento(due: string | undefined, hoy: string): { text: string; tone: string } {
  if (!due) return { text: 'Sin fecha', tone: 'bg-surface-2 text-content-muted' }
  const d = daysBetween(hoy, due)
  if (d < 0) return { text: `Vencida hace ${-d} ${d === -1 ? 'día' : 'días'}`, tone: 'bg-danger-soft text-danger' }
  if (d === 0) return { text: 'Vence hoy', tone: 'bg-danger-soft text-danger' }
  if (d === 1) return { text: 'Vence mañana', tone: 'bg-warn-soft text-warn' }
  if (d <= 7) return { text: `Vence en ${d} días`, tone: 'bg-warn-soft text-warn' }
  return { text: formatDayMonth(due), tone: 'bg-surface-2 text-content-muted' }
}

/**
 * Deudas y préstamos: lo que le debo a alguien y lo que me deben a mí, con su fecha
 * límite. Al saldar una se elige por qué cuenta entró o salió la plata, y así el
 * saldo se ajusta solo; los saldados quedan en «Pagados» y se pueden deshacer.
 */
export function DebtsCard({ fin }: { fin: Fin }) {
  const hoy = todayIso()
  const [dir, setDir] = useState<DebtDirection>('me_deben')
  const [adding, setAdding] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)
  const [showPaid, setShowPaid] = useState(false)

  const { pendientes, pagados, totalMeDeben, totalDebo } = useMemo(() => {
    let meDeben = 0
    let debo = 0
    for (const d of fin.debts) {
      if (d.paidAt) continue
      if (d.direction === 'me_deben') meDeben += d.amount
      else debo += d.amount
    }
    const deEste = fin.debts.filter((d) => d.direction === dir)
    return {
      // Lo más urgente primero; lo que no tiene fecha, al final.
      pendientes: deEste
        .filter((d) => !d.paidAt)
        .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')),
      pagados: deEste
        .filter((d) => d.paidAt)
        .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '')),
      totalMeDeben: meDeben,
      totalDebo: debo,
    }
  }, [fin.debts, dir])

  const meta = DEBT_DIRECTION_META[dir]

  return (
    <Card>
      <CardHeader
        title="Deudas y préstamos"
        action={
          <Button variant={adding ? 'primary' : 'outline'} size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus size={14} aria-hidden />
            Añadir
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-ok-soft p-3">
          <p className="text-xs font-semibold text-ok">Me deben</p>
          <p className="text-lg font-bold tabular text-content">{formatCOP(totalMeDeben)}</p>
        </div>
        <div className="rounded-2xl bg-danger-soft p-3">
          <p className="text-xs font-semibold text-danger">Debo</p>
          <p className="text-lg font-bold tabular text-content">{formatCOP(totalDebo)}</p>
        </div>
      </div>

      <SegmentedControl
        options={[
          { value: 'me_deben', label: 'Me deben' },
          { value: 'debo', label: 'Debo' },
        ]}
        value={dir}
        onChange={(v) => {
          setDir(v as DebtDirection)
          setPaying(null)
        }}
        ariaLabel="Qué deudas ver"
      />

      {adding && (
        <DebtForm
          direction={dir}
          onSave={(d) => {
            fin.addDebt(d)
            setAdding(false)
          }}
        />
      )}

      <div className="mt-3 flex flex-col gap-2">
        {pendientes.map((d) => (
          <DebtRow
            key={d.id}
            debt={d}
            hoy={hoy}
            fin={fin}
            paying={paying === d.id}
            onPay={() => setPaying(paying === d.id ? null : d.id)}
            onDone={() => setPaying(null)}
          />
        ))}
        {pendientes.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-line-strong p-4 text-center text-sm text-content-muted">
            {dir === 'me_deben' ? 'Nadie te debe nada.' : 'No le debes nada a nadie.'}
          </p>
        )}
      </div>

      {pagados.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPaid((v) => !v)}
            aria-expanded={showPaid}
            className="flex w-full items-center justify-between gap-2 py-2 text-sm font-semibold text-content-muted transition-colors hover:text-content"
          >
            {meta.paid} ({pagados.length})
            <ChevronDown size={16} className={cx('transition-transform', showPaid && 'rotate-180')} aria-hidden />
          </button>
          {showPaid && (
            <div className="flex flex-col">
              {pagados.map((d) => {
                const acc = fin.accounts.find((a) => a.id === d.paidAccountId)
                return (
                  <div key={d.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                      <Check size={14} strokeWidth={2.6} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">
                        {d.person}
                        {d.concept ? ` · ${d.concept}` : ''}
                      </p>
                      <p className="truncate text-xs text-content-muted">
                        {formatDayMonth(d.paidAt!)}
                        {acc ? ` · ${acc.name}` : ' · sin cuenta'}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular text-content-muted line-through">
                      {formatCOP(d.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => fin.unmarkDebtPaid(d.id)}
                      aria-label={`Deshacer: volver a dejar pendiente lo de ${d.person}`}
                      title="Deshacer"
                    >
                      <RotateCcw size={14} aria-hidden />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function DebtRow({
  debt,
  hoy,
  fin,
  paying,
  onPay,
  onDone,
}: {
  debt: Debt
  hoy: string
  fin: Fin
  paying: boolean
  onPay: () => void
  onDone: () => void
}) {
  const meta = DEBT_DIRECTION_META[debt.direction]
  const due = vencimiento(debt.dueDate, hoy)
  const [accountId, setAccountId] = useState(
    fin.accounts.find((a) => a.kind !== 'externa')?.id ?? '',
  )
  const [date, setDate] = useState(hoy)

  return (
    <div className="rounded-2xl border border-line p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-content">{debt.person}</p>
          {debt.concept && <p className="truncate text-sm text-content-muted">{debt.concept}</p>}
          <span className={cx('mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', due.tone)}>
            {due.text}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-[15px] font-bold tabular text-content">{formatCOP(debt.amount)}</p>
          <button
            type="button"
            onClick={() => fin.removeDebt(debt.id)}
            aria-label={`Borrar lo de ${debt.person}`}
            className="text-content-subtle transition-colors hover:text-danger"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      </div>

      {paying ? (
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl bg-surface-2 p-3 sm:grid-cols-2">
          <Field label={debt.direction === 'me_deben' ? '¿A qué cuenta entró?' : '¿De qué cuenta salió?'}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {fin.accounts
                .filter((a) => a.kind !== 'externa')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              <option value="">Ninguna (solo marcarla)</option>
            </Select>
          </Field>
          <Field label="Fecha del pago">
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              variant="primary"
              onClick={() => {
                fin.markDebtPaid(debt.id, date || hoy, accountId || undefined)
                onDone()
              }}
            >
              <Check size={15} aria-hidden />
              Confirmar
            </Button>
            <Button variant="ghost" onClick={onPay}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onPay}>
          <Check size={14} aria-hidden />
          {meta.pay}
        </Button>
      )}
    </div>
  )
}

function DebtForm({
  direction,
  onSave,
}: {
  direction: DebtDirection
  onSave: (d: Omit<Debt, 'id'>) => void
}) {
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState('')
  const [dueDate, setDueDate] = useState('')

  function guardar() {
    const monto = parseMonto(amount)
    if (!person.trim() || monto <= 0) return
    onSave({
      direction,
      person: person.trim(),
      amount: monto,
      concept: concept.trim() || undefined,
      dueDate: dueDate || undefined,
    })
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl bg-surface-2 p-3 sm:grid-cols-2">
      <Field label={direction === 'me_deben' ? '¿Quién te debe?' : '¿A quién le debes?'}>
        <TextInput value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Nombre" />
      </Field>
      <Field label="Monto (COP)">
        <TextInput
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
        />
      </Field>
      <Field label="¿Por qué?">
        <TextInput
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Opcional: la boleta del concierto"
        />
      </Field>
      <Field label="¿Para cuándo?" hint="Opcional">
        <DateInput value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <Button variant="primary" onClick={guardar} className="sm:col-span-2">
        Guardar
      </Button>
    </div>
  )
}
