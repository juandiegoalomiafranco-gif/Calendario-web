import { Palette } from 'lucide-react'
import { AccountSettings } from '../components/AccountSettings'
import { NotificationSettings } from '../components/NotificationSettings'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { ThemeToggle } from '../components/ui/ThemeToggle'

/*
 * Las tarjetas de entreno (frecuencia cardiaca, ritmo y el puente con el entrenador)
 * se quitaron al ocultar Entreno; ver `MODULOS_OCULTOS` en navItems.ts. Sus datos
 * siguen guardados en la nube.
 */
export function Settings() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Ajustes" description="Apariencia, tu cuenta y los avisos." />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card>
            <CardHeader
              title="Apariencia"
              icon={<Palette size={16} className="text-content-subtle" aria-hidden />}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-content-muted">
                Claro, oscuro o lo que use tu dispositivo.
              </p>
              <ThemeToggle />
            </div>
          </Card>

          <AccountSettings />
        </div>

        <div className="flex flex-col gap-4 lg:gap-5">
          <NotificationSettings />
        </div>
      </div>
    </div>
  )
}
