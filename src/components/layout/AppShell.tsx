import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { NowNextCard } from '../panels/NowNextCard'
import { UrgentTasksCard } from '../panels/UrgentTasksCard'
import { BottomNav } from './BottomNav'
import { IconRail } from './IconRail'
import { TopBar } from './TopBar'

/**
 * Estructura responsive de MyLife:
 * - móvil y tablet: contenido a ancho completo + barra inferior de cinco pestañas
 * - escritorio (lg+): rail de iconos de 72 px, barra superior y contenido ancho
 * - pantallas anchas (xl+): además, panel de contexto a la derecha con «Ahora mismo»
 *   y «Pendientes urgentes» — salvo en Inicio, donde el bento ya los muestra.
 */
/**
 * Pantallas que ya muestran el horario o los pendientes por sí mismas: ahí el panel
 * de contexto sobraría y sólo quitaría espacio.
 */
const WITHOUT_CONTEXT = ['/', '/calendario', '/colegio', '/clases', '/pendientes', '/materias']

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const showContext = !WITHOUT_CONTEXT.includes(pathname)

  return (
    <div className="app-shell bg-bg">
      <IconRail />

      <div className="lg:pl-[72px]">
        <TopBar />

        <div
          className={cx(
            'mx-auto w-full px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)]',
            'sm:px-6 lg:max-w-[1600px] lg:px-8 lg:pb-12 lg:pt-7',
            showContext && 'xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-7',
          )}
        >
          <main className="min-w-0">{children}</main>

          {showContext && (
            <aside className="sticky top-[calc(4rem+1.75rem)] hidden flex-col gap-4 xl:flex">
              <NowNextCard />
              <UrgentTasksCard />
            </aside>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
