import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound } from 'lucide-react'
import { emailForCode, lock, markUnlocked, MIN_CODE_LENGTH, signInWithCode } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'

/**
 * Pantalla de entrada: el código inicia sesión en la nube y desbloquea la app.
 * Es la misma llave en los dos sitios, así el celular y el computador abren los
 * mismos datos.
 *
 * Solo se pide UNA vez por dispositivo: si al abrir ya hay sesión guardada, se entra
 * directo. Vuelve a pedirse al cerrar sesión desde Ajustes o si la nube la invalida.
 */
export function CodeGate({ children }: { children: ReactNode }) {
  // `null` = comprobando. La sesión se lee de `localStorage` sin red, así que es un
  // instante; mientras, se pinta el fondo vacío en vez de asomar la pantalla del código.
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let vivo = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      if (data.session) {
        // También cubre a quien entró con la versión anterior, que no dejaba marca.
        markUnlocked()
        setUnlocked(true)
      } else {
        lock()
        setUnlocked(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        lock()
        setUnlocked(false)
      }
    })
    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

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

  if (unlocked === null) return <div className="min-h-[100svh] bg-bg" />
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
          Solo te lo pediremos una vez en este dispositivo. El mismo código en el
          celular y en el computador abre tus mismos datos.
        </p>
      </form>
    </div>
  )
}
