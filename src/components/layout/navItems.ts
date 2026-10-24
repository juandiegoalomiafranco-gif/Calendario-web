import {
  CalendarDays,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Menu,
  Notebook,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
  /** Sólo la ruta exacta marca activo (para "/"). */
  end?: boolean
}

/** Destinos del rail de escritorio, en orden. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: LayoutGrid, end: true },
  { to: '/colegio', label: 'Colegio', Icon: GraduationCap },
  { to: '/clases', label: 'Clases', Icon: Notebook },
  { to: '/pendientes', label: 'Pendientes', Icon: ListChecks },
  { to: '/calendario', label: 'Calendario', Icon: CalendarDays },
  { to: '/finanzas', label: 'Finanzas', Icon: Wallet },
]

/** Pie del rail: ajustes. */
export const NAV_FOOTER: NavItem[] = [{ to: '/ajustes', label: 'Ajustes', Icon: Settings }]

/**
 * Las cuatro pestañas de la barra inferior en móvil; en medio va el botón «+» para
 * añadir rápido. «Más» vive en el icono de la cabecera del Inicio.
 */
export const MOBILE_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: LayoutGrid, end: true },
  { to: '/colegio', label: 'Colegio', Icon: GraduationCap },
  { to: '/pendientes', label: 'Pendientes', Icon: ListChecks },
  { to: '/calendario', label: 'Calendario', Icon: CalendarDays },
]

/** Acceso a todas las secciones desde la cabecera del Inicio en el celular. */
export const MAS_ITEM: NavItem = { to: '/mas', label: 'Más secciones', Icon: Menu }

/**
 * Secciones OCULTAS, no borradas: Juan Diego dejó de usar el entreno y la comida.
 * Sus rutas siguen registradas en `App.tsx` y sus datos siguen en la nube; solo se
 * quitaron de los menús, del Inicio, del Calendario y de Ajustes. Para recuperar una
 * basta con volver a ponerla en `NAV_ITEMS` / `MOBILE_ITEMS`.
 */
export const MODULOS_OCULTOS = [
  '/entreno',
  '/entreno/fuerza',
  '/entreno/notas',
  '/comida',
  '/cuerpo',
  '/progreso',
  '/semana',
  '/dia/:date',
] as const
