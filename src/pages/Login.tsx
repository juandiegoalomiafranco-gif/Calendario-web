import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const run = mode === 'signin' ? signIn : signUp
    const { error } = await run(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    if (mode === 'signup') {
      setInfo('Cuenta creada. Si te pide confirmar el correo, revísalo; si no, ya puedes entrar.')
      setMode('signin')
    }
    // Si el login funcionó, el cambio de sesión re-renderiza la app automáticamente.
  }

  return (
    <div className="min-h-[75vh] flex flex-col justify-center gap-5">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-ink-900">Mi Calendario</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          {mode === 'signin' ? 'Entra para ver y guardar tus entrenamientos.' : 'Crea tu cuenta para empezar a registrar.'}
        </p>
      </header>

      <form onSubmit={submit} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Correo
          <input
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>

        {error && (
          <p className="text-sm text-red-300 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
        )}
        {info && (
          <p className="text-sm text-ok-300 bg-ok-500/10 rounded-xl px-3 py-2">{info}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] rounded-xl bg-brand-600 text-white font-semibold active:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin')
          setError(null)
          setInfo(null)
        }}
        className="text-sm text-ink-500 text-center min-h-[44px] active:text-ink-700"
      >
        {mode === 'signin' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Entrar'}
      </button>
    </div>
  )
}
