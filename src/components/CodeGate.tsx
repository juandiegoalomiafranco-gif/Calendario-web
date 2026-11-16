import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound } from 'lucide-react'
import { avisarPrimerPintado } from '../lib/arranque'
import { emailForCode, lock, markUnlocked, MIN_CODE_LENGTH, signInWithCode } from '../lib/auth'
import { leerSesionGuardada, supabase } from '../lib/supabase'
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
  /*
   * Con una sesión guardada se entra en el acto, sin esperar a la nube.
   *
   * Antes se esperaba a `getSession()`, que con el token caducado —lo normal al reabrir
   * la app pasada una hora— primero lo renueva por red: en el celular eran uno o dos
   * segundos de pantalla vacía, y con mala señal la pantalla vacía no se iba nunca. Lo
   * que se pinta sale del propio dispositivo; si la nube resulta haber invalidado la
   * sesión, llega `SIGNED_OUT` y se vuelve a pedir el código.
   *
   * Sin sesión guardada queda `null` (comprobando) hasta que responda `getSession()`,
   * que en ese caso no toca la red: es un instante de fondo vacío en vez de asomar la
   * pantalla del código y quitarla.
   */
  const [unlocked, setUnlocked] = useState<boolean | null>(() =>
    leerSesionGuardada() ? true : null,
  )
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
      } else if (!leerSesionGuardada()) {
        lock()
        setUnlocked(false)
      }
      // Sin sesión en la respuesta pero todavía guardada = no se pudo renovar por falta
      // de red (si la nube la hubiera rechazado, supabase-js ya la habría borrado). Se
      // sigue dentro con lo del dispositivo: la librería reintenta sola al volver la red.
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

  // La primera pantalla de verdad (el código o la app) ya está montada: se puede quitar
  // la bienvenida y empezar a hablar con la nube.
  useEffect(() => {
    if (unlocked !== null) avisarPrimerPintado()
  }, [unlocked])

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
