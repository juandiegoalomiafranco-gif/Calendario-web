import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { NowNextCard } from '../panels/NowNextCard'
import { UrgentTasksCard } from '../panels/UrgentTasksCard'
import { SCROLL_AREA_ID } from '../ScrollToTop'
import { SyncBanner } from '../SyncIndicator'
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

/** Lo que cuenta como «campo de escribir» para apartarlo del teclado. */
const CAMPOS = 'input, textarea, select, [contenteditable="true"]'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const showContext = !WITHOUT_CONTEXT.includes(pathname)
  const teclado = useKeyboardInset()

  /*
   * Al enfocar un campo, subirlo por encima del teclado.
   *
   * En el celular el teclado tapa el tercio de abajo sin encoger el viewport, así que
   * el navegador cree que el campo —y el botón de guardar que va debajo— siguen a la
   * vista. Un solo oyente aquí cubre las veinte rutas.
   */
  useEffect(() => {
    const zona = document.getElementById(SCROLL_AREA_ID)
    if (!zona) return

    const alEnfocar = (e: FocusEvent) => {
      const campo = e.target as HTMLElement | null
      if (!campo?.matches?.(CAMPOS)) return
      // Da tiempo a que el teclado termine de subir; si no, se mide el sitio viejo.
      window.setTimeout(() => campo.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
    }

    zona.addEventListener('focusin', alEnfocar)
    return () => zona.removeEventListener('focusin', alEnfocar)
  }, [])

  return (
    <div className="app-shell flex flex-col bg-bg">
      <IconRail />

      <div className="flex min-h-0 flex-1 flex-col lg:pl-[72px]">
        <TopBar />

        {/*
         * El scroll vive AQUÍ, no en la página.
         *
         * Antes la barra de abajo era `position: fixed`, y en el iPhone eso se mueve:
         * con el rebote elástico al llegar al final, al aparecer el teclado y al
         * cambiar el viewport. Ahora el contenido se desplaza dentro de esta caja y
         * la barra es un hermano suyo, así que no puede moverse ni un píxel.
         */}
        <div id={SCROLL_AREA_ID} className="app-scroll min-h-0 flex-1">
          <div
            // Mientras el teclado está arriba, el contenido crece por debajo para que
            // haya sitio real al que desplazarse. Sin esto no hay a dónde subir.
            style={teclado ? { paddingBottom: teclado + 24 } : undefined}
            className={cx(
              'mx-auto w-full max-w-2xl px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)]',
              'sm:px-6 lg:max-w-[1600px] lg:px-8 lg:pb-12 lg:pt-7',
              showContext && 'xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-7',
            )}
          >
            <main className="min-w-0">
              <SyncBanner />
              {children}
            </main>

            {showContext && (
              <aside className="sticky top-0 hidden flex-col gap-4 xl:flex">
                <NowNextCard />
                <UrgentTasksCard />
              </aside>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
