import { useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound } from 'lucide-react'
import { emailForCode, isUnlocked, markUnlocked, MIN_CODE_LENGTH, signInWithCode } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'

/**
 * Pantalla de entrada: el código inicia sesión en la nube y desbloquea la app.
 * Es la misma llave en los dos sitios, así el celular y el computador abren los
 * mismos datos.
 */
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
    // Si ya hay sesión de esta misma cuenta, desbloquea sin red (sirve sin señal).
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
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-8 bg-bg px-6">
      <div className="text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary">
          <KeyRound size={22} className="text-primary-on" aria-hidden />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-content">MyLife</h1>
        <p className="mt-1 text-sm text-content-muted">Entra con tu código</p>
      </div>

      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={code}
          onChange={(e) => {
            setError(null)
            setCode(e.target.value)
          }}
          placeholder="Tu código"
          inputMode="numeric"
          aria-label="Código de acceso"
          className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-[15px] tracking-widest text-content placeholder:tracking-normal placeholder:text-content-subtle focus:border-primary"
        />
        {error && <p className="text-center text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={busy} className="justify-center">
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-content-subtle">
          El mismo código en el celular y en el computador abre tus mismos datos.
          Guárdalo bien: es tu llave.
        </p>
      </form>
    </div>
  )
}
