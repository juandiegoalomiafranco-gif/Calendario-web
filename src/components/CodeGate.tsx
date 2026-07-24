import { useState, type FormEvent, type ReactNode } from 'react'
import { emailForCode, isUnlocked, markUnlocked, MIN_CODE_LENGTH, signInWithCode } from '../lib/auth'
import { supabase } from '../lib/supabase'

/** Pantalla de entrada por código: inicia sesión en la nube y desbloquea la app. */
export function CodeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked())
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const clean = code.trim()
    if (clean.length < MIN_CODE_LENGTH) {
      setError(`El código debe tener al menos ${MIN_CODE_LENGTH} caracteres.`)
      return
    }
    setBusy(true)
    // Si ya hay sesión de esta misma cuenta (mismo código), desbloquea sin red (offline-ok).
    const email = await emailForCode(clean)
    const { data } = await supabase.auth.getSession()
    if (data.session?.user.email === email) {
      markUnlocked()
      setUnlocked(true)
      setBusy(false)
      return
    }
    const res = await signInWithCode(clean)
    setBusy(false)
    if (res.ok) {
      markUnlocked()
      setUnlocked(true)
    } else {
      setError(res.error ?? 'No se pudo entrar.')
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="min-h-[100svh] bg-ink-50 flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <p className="text-4xl mb-2">🔐</p>
        <h1 className="text-2xl font-bold text-ink-900 font-display">Mi Vida</h1>
        <p className="text-sm text-ink-500 mt-1">Entra con tu código de acceso</p>
      </div>
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => {
            setError(null)
            setCode(e.target.value)
          }}
          placeholder={`Tu código (mín. ${MIN_CODE_LENGTH})`}
          className="rounded-xl border border-ink-200 bg-card px-4 py-3 text-base text-ink-900 text-center tracking-widest"
        />
        {error && <p className="text-sm font-medium text-brand-600 text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-500 text-white font-semibold py-3 active:bg-brand-600 disabled:opacity-60"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="text-[11px] text-ink-400 text-center">
          El mismo código en cualquier dispositivo abre tus mismos datos. Guárdalo bien: es tu llave.
        </p>
      </form>
    </div>
  )
}
