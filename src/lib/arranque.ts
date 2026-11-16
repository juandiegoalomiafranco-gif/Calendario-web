/**
 * Orden del arranque: primero se pinta la pantalla con lo que ya hay en el dispositivo y
 * DESPUÉS se habla con la nube.
 *
 * Al abrir la app, los stores, Google, la siembra del colegio y los avisos arrancaban
 * todos a la vez mientras React montaba la primera pantalla, compitiendo con ella por
 * el procesador del celular y por la red. Nada de eso hace falta para pintar: los datos
 * salen de la caché local. Aquí se pone en fila para después del primer pintado.
 */

declare global {
  interface Window {
    /** Lo define el script de la pantalla de bienvenida en index.html. */
    __ocultarSplash?: () => void
  }
}

let pintado = false
const trasPintar: (() => void)[] = []

/** Corre `fn` en cuanto la primera pantalla de verdad esté pintada (o ya, si lo está). */
export function trasPrimerPintado(fn: () => void): void {
  if (pintado) fn()
  else trasPintar.push(fn)
}

/**
 * Lo que puede esperar a que el celular esté desocupado: precargar pantallas, módulos
 * ocultos, registrar el service worker…
 *
 * Safari no tiene `requestIdleCallback`; ahí basta un respiro corto tras el pintado.
 */
export function cuandoHayaCalma(fn: () => void): void {
  trasPrimerPintado(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback
    if (ric) ric(fn, { timeout: 2_000 })
    else window.setTimeout(fn, 600)
  })
}

function marcarPintado() {
  if (pintado) return
  pintado = true
  window.__ocultarSplash?.()
  for (const fn of trasPintar.splice(0)) {
    try {
      fn()
    } catch (e) {
      console.error('[arranque]', e)
    }
  }
}

/**
 * Lo llama la primera pantalla real (el código o el Inicio) desde un efecto. El efecto
 * corre tras el commit, pero puede ser antes de que el navegador pinte: con el siguiente
 * cuadro y un turno más, lo de la cola ya no retrasa ese pintado.
 */
export function avisarPrimerPintado(): void {
  if (pintado) return
  requestAnimationFrame(() => window.setTimeout(marcarPintado, 0))
}

// Respaldo: si por un fallo nadie avisa, que la sincronización arranque igual y la
// pantalla de bienvenida no se quede encima para siempre.
if (typeof window !== 'undefined') window.setTimeout(marcarPintado, 4_000)
