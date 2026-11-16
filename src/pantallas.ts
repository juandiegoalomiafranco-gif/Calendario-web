import { createElement, lazy, useState, type ComponentType } from 'react'
import { cuandoHayaCalma } from './lib/arranque'

/*
 * Las pantallas que no son el Inicio van en trozos aparte.
 *
 * Antes toda la app era un solo archivo de ~700 kB y el celular tenía que bajarlo y
 * leerlo entero para pintar el Inicio, aunque las otras diecinueve pantallas no se
 * usaran en esa apertura. Ahora el Inicio sale primero y el resto se baja en cuanto hay
 * calma (ver `precargarPantallas`), así que al tocar una pestaña ya está ahí.
 *
 * El archivo es `.ts` y crea los elementos con `createElement` para que las pantallas
 * se puedan exportar junto a la función de precarga sin romper el recargado en caliente.
 */

type Modulo = Record<string, unknown>

const RECARGA = 'mivida:recarga-por-pantalla'

function SinCargar() {
  return createElement(
    'p',
    { className: 'py-16 text-center text-caption text-content-muted' },
    'No se pudo abrir esta pantalla. Revisa la conexión y vuelve a intentarlo.',
  )
}

/**
 * Tras un despliegue, Vercel ya no sirve los trozos de la versión anterior: una app que
 * se abrió antes y pide uno que aún no tenía recibe un 404. Recargar trae la versión
 * nueva. Solo con red (sin ella, recargar dejaría el error de Safari en vez de la app)
 * y como mucho una vez cada medio minuto, para no entrar en bucle.
 */
function alFallar(error: unknown): ComponentType {
  console.error('[pantallas] no se pudo cargar una pantalla', error)
  try {
    const ultima = Number(sessionStorage.getItem(RECARGA) || 0)
    if (navigator.onLine && Date.now() - ultima > 30_000) {
      sessionStorage.setItem(RECARGA, String(Date.now()))
      window.location.reload()
    }
  } catch {
    // Sin almacenamiento no se recarga: se queda el aviso y se reintenta al volver.
  }
  return SinCargar
}

const visibles: (() => Promise<unknown>)[] = []
const ocultas: (() => Promise<unknown>)[] = []

function perezosa<P extends object>(
  cargar: () => Promise<Modulo>,
  nombre: string,
  grupo: 'visible' | 'oculta' = 'visible',
): ComponentType<P> {
  let lista: ComponentType<P> | null = null
  let enCurso: Promise<ComponentType<P>> | null = null

  function traer(): Promise<ComponentType<P>> {
    enCurso ??= cargar().then(
      (m) => (lista = m[nombre] as ComponentType<P>),
      (error) => {
        enCurso = null // que el próximo intento vuelva a pedirla
        throw error
      },
    )
    return enCurso
  }

  const crearPerezosa = () =>
    lazy(() =>
      traer().then(
        (c) => ({ default: c }),
        (error) => {
          // `lazy` recuerda su resultado: para poder reintentar se crea una nueva.
          Perezosa = crearPerezosa()
          return { default: alFallar(error) as ComponentType<P> }
        },
      ),
    )
  let Perezosa = crearPerezosa()

  function Pantalla(props: P) {
    // Ya bajada se pinta directa, sin pasar por Suspense ni un cuadro vacío. Se decide
    // una vez por montaje: cambiar de tipo con la pantalla abierta la desmontaría y se
    // perdería lo que se estuviera escribiendo.
    const [Componente] = useState<ComponentType<P>>(
      () => lista ?? (Perezosa as unknown as ComponentType<P>),
    )
    return createElement(Componente, props)
  }

  ;(grupo === 'visible' ? visibles : ocultas).push(() => traer().catch(() => undefined))
  return Pantalla
}

export const Colegio = perezosa(() => import('./pages/Colegio'), 'Colegio')
export const Pendientes = perezosa(() => import('./pages/Pendientes'), 'Pendientes')
export const Calendario = perezosa(() => import('./pages/Calendario'), 'Calendario')
export const Mas = perezosa(() => import('./pages/Mas'), 'Mas')
export const Finanzas = perezosa(() => import('./pages/Finanzas'), 'Finanzas')
export const Clases = perezosa(() => import('./pages/Clases'), 'Clases')
export const Materias = perezosa(() => import('./pages/Materias'), 'Materias')
export const ClassDetail = perezosa(() => import('./pages/ClassDetail'), 'ClassDetail')
export const NotaDetalle = perezosa(() => import('./pages/NotaDetalle'), 'NotaDetalle')
export const Settings = perezosa(() => import('./pages/Settings'), 'Settings')

// Módulos ocultos (ver `MODULOS_OCULTOS`): se bajan igual, después, para que sus datos
// sigan sincronizándose y su cola de salida no se quede sin subir.
export const Entreno = perezosa(() => import('./pages/Entreno'), 'Entreno', 'oculta')
export const Strength = perezosa(() => import('./pages/Strength'), 'Strength', 'oculta')
export const GymNotes = perezosa(() => import('./pages/GymNotes'), 'GymNotes', 'oculta')
export const BodyProgress = perezosa(() => import('./pages/BodyProgress'), 'BodyProgress', 'oculta')
export const Comida = perezosa(() => import('./pages/Comida'), 'Comida', 'oculta')
export const Progress = perezosa(() => import('./pages/Progress'), 'Progress', 'oculta')
export const Week = perezosa(() => import('./pages/Week'), 'Week', 'oculta')
export const DayDetail = perezosa(() => import('./pages/DayDetail'), 'DayDetail', 'oculta')

/** Baja las pantallas de las pestañas y luego, con otra pausa, las de los módulos ocultos. */
export function precargarPantallas(): void {
  void Promise.all(visibles.map((p) => p())).then(() =>
    cuandoHayaCalma(() => ocultas.forEach((p) => void p())),
  )
}
