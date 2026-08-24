import { useEffect, useState } from 'react'

/**
 * Cuántos píxeles de la pantalla está tapando el teclado del celular.
 *
 * En iOS el teclado NO encoge el viewport de layout: `100dvh` y `position: fixed`
 * siguen midiendo la pantalla entera, así que todo lo que quede abajo —el pie con
 * «Guardar», la barra de navegación— se va detrás del teclado y no hay forma de
 * tocarlo. `visualViewport` sí sabe qué parte se ve de verdad, y la diferencia con
 * `innerHeight` es justo lo que hay que apartar.
 *
 * Devuelve 0 si el navegador no expone `visualViewport`: ahí todo se queda
 * exactamente como estaba.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const medir = () => {
      const tapado = window.innerHeight - (vv.height + vv.offsetTop)
      // Por debajo de 80 px es la barra del navegador escondiéndose al hacer
      // scroll, no un teclado. Si reaccionáramos a eso, la pantalla temblaría.
      setInset(tapado > 80 ? Math.round(tapado) : 0)
    }

    medir()
    vv.addEventListener('resize', medir)
    vv.addEventListener('scroll', medir)
    return () => {
      vv.removeEventListener('resize', medir)
      vv.removeEventListener('scroll', medir)
    }
  }, [])

  return inset
}
