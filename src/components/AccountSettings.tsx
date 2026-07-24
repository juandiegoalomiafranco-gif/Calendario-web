import { useEffect, useState } from 'react'
import { hasSession, signOut } from '../lib/auth'

/** Tarjeta de Ajustes: estado de la cuenta (login por código) y cerrar sesión. */
export function AccountSettings() {
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    void hasSession().then(setLogged)
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.reload()
  }

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-ink-900">Cuenta</p>
        <p className="text-xs text-ink-500">
          {logged
            ? 'Sesión iniciada con tu código. Tus datos se sincronizan en la nube.'
            : 'Sin sesión activa.'}
        </p>
      </div>
      <button
        onClick={handleSignOut}
        className="self-start rounded-full bg-ink-100 text-ink-700 text-sm font-semibold px-4 py-2 active:bg-ink-200"
      >
        Cerrar sesión / cambiar código
      </button>
      <p className="text-[11px] text-ink-400">
        Cerrar sesión te lleva a la pantalla del código. Entrar con otro código abre otra cuenta de datos.
        El código es tu llave; guárdalo bien.
      </p>
    </div>
  )
}
