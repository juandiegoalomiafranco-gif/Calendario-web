import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoneyInput } from '../components/MoneyInput'
import { SaveIndicator } from '../components/SaveIndicator'
import { ACCOUNT_KINDS, accountKindMeta } from '../data/categories'
import type { Account, AccountKind } from '../data/types'
import { signOut, useAuth } from '../hooks/useAuth'
import {
  accountsStore,
  newId,
  useAccounts,
  useBudgets,
  useGoals,
  useTransactions,
} from '../hooks/useStores'
import { buildBackup, downloadBackup, importBackup } from '../lib/backup'
import { formatMoney } from '../lib/format'
import { accountsWithBalance } from '../lib/finanzas'

interface AccountForm {
  name: string
  kind: AccountKind
  initialBalance: number
}

export function Ajustes() {
  const { session } = useAuth()
  const accounts = useAccounts()
  const transactions = useTransactions()
  const budgets = useBudgets()
  const goals = useGoals()

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<AccountForm>({ name: '', kind: 'banco', initialBalance: 0 })
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const withBalance = useMemo(
    () => accountsWithBalance(accounts, transactions),
    [accounts, transactions],
  )
  const archived = useMemo(() => accounts.filter((a) => a.archived), [accounts])

  function startNew() {
    setForm({ name: '', kind: 'banco', initialBalance: 0 })
    setEditing('nuevo')
  }

  function startEdit(account: Account) {
    setForm({ name: account.name, kind: account.kind, initialBalance: account.initialBalance })
    setEditing(account.id)
  }

  function saveAccount() {
    if (!form.name.trim()) return
    const existing = accounts.find((a) => a.id === editing)
    accountsStore.save({
      id: existing?.id ?? newId(),
      name: form.name.trim(),
      kind: form.kind,
      initialBalance: form.initialBalance,
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
    setEditing(null)
  }

  function toggleArchived(account: Account) {
    // Archivar en vez de borrar: los movimientos viejos siguen teniendo sentido.
    accountsStore.save({ ...account, archived: !account.archived })
  }

  function exportBackup() {
    downloadBackup(buildBackup(accounts, transactions, budgets, goals))
  }

  async function handleImport(file: File) {
    const text = await file.text()
    const result = importBackup(text)
    setImportMessage({ ok: result.ok, text: result.message })
    if (fileRef.current) fileRef.current.value = ''
  }

  if (editing) {
    const isNew = editing === 'nuevo'
    const account = accounts.find((a) => a.id === editing)
    const hasMovements = transactions.some(
      (t) => t.accountId === editing || t.toAccountId === editing,
    )

    return (
      <div className="flex flex-col gap-4">
        <header>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
          >
            <span aria-hidden>←</span> Ajustes
          </button>
          <h1 className="text-2xl font-bold text-ink-900 mt-1">
            {isNew ? 'Nueva cuenta' : 'Editar cuenta'}
          </h1>
        </header>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Nombre
          <input
            type="text"
            value={form.name}
            placeholder="Ej: Bancolombia"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Tipo
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as AccountKind })}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          >
            {ACCOUNT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.emoji} {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-500">
          {form.kind === 'tarjeta' ? 'Deuda inicial' : 'Saldo inicial'}
          <MoneyInput
            value={form.initialBalance}
            onChange={(initialBalance) => setForm({ ...form, initialBalance })}
          />
          <span className="text-xs text-ink-500">
            Lo que tenía la cuenta antes de empezar a registrar movimientos aquí.
          </span>
        </label>

        <button
          type="button"
          onClick={saveAccount}
          disabled={!form.name.trim()}
          className="min-h-[52px] rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600 disabled:opacity-40"
        >
          {isNew ? 'Crear cuenta' : 'Guardar cambios'}
        </button>

        {account && (
          <>
            <button
              type="button"
              onClick={() => {
                toggleArchived(account)
                setEditing(null)
              }}
              className="min-h-[48px] rounded-full border border-ink-200 text-ink-700 font-medium active:bg-ink-100"
            >
              {account.archived ? 'Reactivar cuenta' : 'Archivar cuenta'}
            </button>
            {hasMovements && (
              <p className="text-xs text-ink-500 text-center -mt-2">
                Esta cuenta tiene movimientos, así que se archiva en vez de borrarse: el
                histórico se conserva y deja de sumar al patrimonio.
              </p>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 -ml-2 min-h-[44px] px-2 rounded-full text-sm text-ink-500 font-medium active:bg-ink-100"
          >
            <span aria-hidden>←</span> Resumen
          </Link>
          <h1 className="text-3xl font-bold text-ink-900 mt-1">Ajustes</h1>
          <SaveIndicator />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Mis cuentas</h2>
          <button
            type="button"
            onClick={startNew}
            className="min-h-[44px] px-4 rounded-full bg-card shadow-card text-sm font-medium text-brand-300"
          >
            + Nueva
          </button>
        </div>
        {withBalance.map((a) => {
          const meta = accountKindMeta(a.kind)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => startEdit(a)}
              className="text-left flex items-center gap-3 rounded-3xl bg-card shadow-card p-3.5 active:scale-[0.99] transition-transform"
            >
              <span className="shrink-0 w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-lg">
                <span aria-hidden>{meta.emoji}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900 truncate">{a.name}</span>
                <span className="block text-xs text-ink-500 tabular-nums">
                  {formatMoney(a.balance)} · inicial {formatMoney(a.initialBalance)}
                </span>
              </span>
              <span className="text-ink-500 shrink-0" aria-hidden>
                ›
              </span>
            </button>
          )
        })}
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-600">Archivadas</h2>
          {archived.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => startEdit(a)}
              className="text-left flex items-center gap-3 rounded-2xl bg-card shadow-card p-3 opacity-70"
            >
              <span className="text-sm text-ink-700 flex-1 truncate">{a.name}</span>
              <span className="text-xs text-ink-500">archivada</span>
            </button>
          ))}
        </section>
      )}

      <section className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Respaldo</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Descarga una copia de todo en un archivo JSON. Guárdala donde quieras: es tu red de
            seguridad si algo le pasa a la cuenta.
          </p>
        </div>

        <button
          type="button"
          onClick={exportBackup}
          className="min-h-[48px] rounded-full bg-ink-100 text-ink-900 font-medium active:bg-ink-200"
        >
          ⬇ Descargar respaldo
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-[48px] rounded-full border border-ink-200 text-ink-700 font-medium active:bg-ink-100"
        >
          ⬆ Importar respaldo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
          }}
        />
        <p className="text-xs text-ink-500">
          Importar reemplaza lo que tengas ahora por el contenido del archivo.
        </p>

        {importMessage && (
          <p
            className={`text-sm ${importMessage.ok ? 'text-ok-400' : 'text-danger-400'}`}
            role="status"
          >
            {importMessage.text}
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Cuenta</h2>
          {session?.user.email && (
            <p className="text-sm text-ink-500 mt-0.5 break-all">{session.user.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-[48px] rounded-full border border-ink-200 text-ink-700 font-medium active:bg-ink-100"
        >
          Cerrar sesión
        </button>
      </section>

      <p className="text-xs text-ink-500 text-center">
        {accounts.length} cuentas · {transactions.length} movimientos · {goals.length} metas
      </p>
    </div>
  )
}
