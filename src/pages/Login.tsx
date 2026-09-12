import { useState } from 'react'
import { resetPassword, signIn, signUp } from '../hooks/useAuth'
import { isConfigured } from '../lib/supabase'

type Mode = 'entrar' | 'crear' | 'recuperar'

const TITLES: Record<Mode, string> = {
  entrar: 'Entrar',
  crear: 'Crear cuenta',
  recuperar: 'Recuperar contraseña',
}

export function Login() {
  const [mode, setMode] = useState<Mode>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (!isConfigured) {
    return (
      <div className="flex flex-col gap-4 pt-8">
        <h1 className="text-2xl font-bold text-ink-900">Falta configurar Supabase</h1>
        <div className="rounded-3xl bg-card shadow-card p-4 text-sm text-ink-600 flex flex-col gap-2">
          <p>
            La app no encuentra las variables de entorno, así que no puede guardar nada en la nube.
          </p>
          <p>
            Copia <code className="text-ink-900">.env.example</code> a{' '}
            <code className="text-ink-900">.env</code>, pega la URL y la publishable key de tu
            proyecto y vuelve a levantar el servidor.
          </p>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    if (mode === 'recuperar') {
      const err = await resetPassword(email)
      setError(err)
      if (!err) setInfo('Te enviamos un correo con el enlace para cambiar la contraseña.')
      setBusy(false)
      return
    }

    const err = mode === 'crear' ? await signUp(email, password) : await signIn(email, password)
    setError(err)
    if (!err && mode === 'crear') {
      setInfo('Cuenta creada. Si tu proyecto pide confirmar el correo, revisa tu bandeja.')
    }
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-5 pt-6">
      <header className="text-center">
        <span className="text-5xl" aria-hidden>
          💰
        </span>
        <h1 className="text-2xl font-bold text-ink-900 mt-2">Mis Finanzas</h1>
        <p className="text-sm text-ink-500 mt-1">
          Tus cuentas, gastos y metas — sincronizados entre tus dispositivos.
        </p>
      </header>

      <form onSubmit={submit} className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink-900">{TITLES[mode]}</h2>

        <label className="flex flex-col gap-1 text-sm text-ink-500">
          Correo
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
          />
        </label>

        {mode !== 'recuperar' && (
          <label className="flex flex-col gap-1 text-sm text-ink-500">
            Contraseña
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'crear' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2.5 text-base text-ink-900"
            />
          </label>
        )}

        {error && (
          <p className="text-sm text-danger-400" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-ok-400" role="status">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600 disabled:opacity-50"
        >
          {busy ? 'Un momento…' : TITLES[mode]}
        </button>
      </form>

      <div className="flex flex-col items-center gap-1 text-sm">
        {mode !== 'entrar' && (
          <button type="button" onClick={() => setMode('entrar')} className="min-h-[44px] px-3 text-brand-300 font-medium">
            Ya tengo cuenta, entrar
          </button>
        )}
        {mode !== 'crear' && (
          <button type="button" onClick={() => setMode('crear')} className="min-h-[44px] px-3 text-brand-300 font-medium">
            Crear una cuenta nueva
          </button>
        )}
        {mode !== 'recuperar' && (
          <button type="button" onClick={() => setMode('recuperar')} className="min-h-[44px] px-3 text-ink-500">
            Olvidé mi contraseña
          </button>
        )}
      </div>
    </div>
  )
}
