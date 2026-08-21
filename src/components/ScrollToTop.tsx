import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Id del contenedor que hace scroll dentro del armazón (ver AppShell). */
export const SCROLL_AREA_ID = 'app-scroll'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // El scroll ya no vive en la ventana sino en el contenedor del armazón, que es
    // lo que mantiene quieta la barra de abajo. `window.scrollTo` aquí no haría nada.
    document.getElementById(SCROLL_AREA_ID)?.scrollTo({ top: 0 })
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
