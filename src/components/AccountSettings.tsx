import { useEffect, useState } from 'react'
import { Cloud, LogOut, Smartphone } from 'lucide-react'
import { hasSession, signOut } from '../lib/auth'
import { syncNow } from '../lib/cloudStore'
import { syncLabel, useSyncStatus } from '../lib/syncStatus'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'

/** Cuenta y sincronización: el código, el estado de la nube y cerrar sesión. */
export function AccountSettings() {
  const [logged, setLogged] = useState(false)
  const status = useSyncStatus()
  const { text } = syncLabel(status)

  useEffect(() => {
    void hasSession().then(setLogged)
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader
        title="Cuenta y sincronización"
        icon={<Cloud size={16} className="text-content-subtle" aria-hidden />}
      />

      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-surface-2 p-3.5">
          <p className="text-sm font-semibold text-content">{text}</p>
          <p className="mt-0.5 text-xs text-content-muted">
            {logged
              ? status.pending > 0
                ? `Quedan ${status.pending} cambios por subir. Suben solos en cuanto haya conexión.`
                : 'Todo lo tuyo está guardado en la nube.'
              : 'Sin sesión: los datos solo viven en este dispositivo.'}
          </p>
          {status.lastError && (
            <p className="mt-1.5 text-xs text-danger">{status.lastError}</p>
          )}
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-line p-3.5">
          <Smartphone size={16} className="mt-0.5 shrink-0 text-content-subtle" aria-hidden />
          <p className="text-xs leading-relaxed text-content-muted">
            Para ver lo mismo en el otro dispositivo, abre la app ahí y escribe{' '}
            <strong className="text-content">el mismo código</strong>. Lo que guardes en uno
            aparece en el otro solo, sin recargar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={syncNow}>Sincronizar ahora</Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut size={15} aria-hidden />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Card>
  )
}
