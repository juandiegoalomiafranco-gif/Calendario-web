/*
 * La franja vacía de abajo en el iPhone, con la app instalada.
 *
 * Instalada en la pantalla de inicio y con la barra de estado en estilo `default`, iOS
 * a veces descuenta la barra de estado DOS veces al calcular el alto de la ventana: la
 * vista web sí llega al borde de abajo, pero `innerHeight` —y con él todo lo que es
 * `position: fixed`, incluido `.app-shell`— se queda corto justo el alto de esa barra.
 * Se ve como una banda de ~50 pt debajo de la píldora de navegación donde no hay app,
 * solo el fondo del documento. Anclar el armazón a los cuatro bordes no lo arregla,
 * porque los bordes que ve el CSS ya son los equivocados.
 *
 * Ninguna unidad de CSS mide bien ese caso, así que se mide aquí. En vertical, lo
 * normal es que entre el alto de la pantalla y `innerHeight` haya cero (barra
 * translúcida) o una barra de estado (20–62 pt). Si la diferencia es más o menos el
 * doble, sobra exactamente una barra, y el armazón se estira hacia abajo esa cantidad
 * con `--hueco-ios-abajo` (ver `.app-shell` en index.css).
 *
 * En cualquier otro caso —Safari sin instalar, teclado abierto, horizontal, iPad,
 * Android, escritorio— la variable queda en 0 y no cambia nada. Por eso es seguro
 * aunque Apple arregle el fallo: el día que deje de pasar, esto deja de actuar solo.
 */

export interface MedidasPantalla {
  /** Alto de la pantalla en vertical, en puntos (`screen.height`). */
  pantalla: number
  /** Alto que la vista web dice tener (`innerHeight`). */
  ventana: number
  /** Lo que se le añade al armazón por abajo; 0 si no hay fallo. */
  hueco: number
  /** Si corre como app instalada en un iPhone. */
  iphoneInstalada: boolean
}

function esIphoneInstalada(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  const instalada =
    nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  return instalada && /iPhone|iPod/.test(navigator.userAgent)
}

export function medirPantalla(): MedidasPantalla {
  const iphoneInstalada = esIphoneInstalada()
  // iOS da `screen` siempre en vertical, gire como gire el teléfono.
  const pantalla = Math.max(screen.width, screen.height)
  const ventana = window.innerHeight
  let hueco = 0

  if (iphoneInstalada && window.matchMedia('(orientation: portrait)').matches) {
    const diferencia = pantalla - ventana
    // 80–140: el doble de una barra de estado. Por debajo es lo normal; por encima es
    // el teclado abierto (~300 pt) u otra cosa que no es este fallo.
    if (diferencia >= 80 && diferencia <= 140) {
      // Tope de 64 pt: ninguna barra de estado de iPhone mide más, y si alguna vez la
      // cuenta saliera mal, la píldora no puede irse fuera de la pantalla.
      hueco = Math.min(Math.round(diferencia / 2), 64)
    }
  }

  return { pantalla, ventana, hueco, iphoneInstalada }
}

function aplicar() {
  const { hueco } = medirPantalla()
  document.documentElement.style.setProperty('--hueco-ios-abajo', `${hueco}px`)
}

/**
 * Mide y corrige ya (antes del primer pintado, si se llama al cargar el módulo) y
 * vuelve a medir cuando puede cambiar: al girar, al volver de segundo plano —iOS a
 * veces recoloca la vista web al reactivar la app— y al cambiar el tamaño.
 */
export function corregirHuecoInferiorIOS() {
  if (typeof window === 'undefined') return
  aplicar()
  window.addEventListener('resize', aplicar)
  window.addEventListener('orientationchange', aplicar)
  window.addEventListener('pageshow', aplicar)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') aplicar()
  })
}
