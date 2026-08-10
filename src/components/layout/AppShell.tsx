import type { ReactNode } from 'react'
import { PLAN, todayISO } from '../../data/plan'
import { useTrainingLog } from '../../hooks/useTrainingLog'
import { completionRate } from '../../lib/stats'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

/**
 * Estructura responsive de la app:
 * - móvil / tablet: contenido a ancho completo + navegación inferior flotante
 * - escritorio (lg+): barra lateral fija de 264 px y contenido ancho, sin barra inferior
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { log } = useTrainingLog()
  const { pct } = completionRate(PLAN, log, todayISO())

  return (
    <div className="app-shell bg-bg">
      <Sidebar completionPct={pct} />
      <div className="lg:pl-[264px]">
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
