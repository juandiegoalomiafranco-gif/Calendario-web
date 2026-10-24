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

/** Las cinco pestañas de la barra inferior en móvil: lo que más se usa, a un toque. */
export const MOBILE_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: LayoutGrid, end: true },
  { to: '/colegio', label: 'Colegio', Icon: GraduationCap },
  { to: '/pendientes', label: 'Pendientes', Icon: ListChecks },
  { to: '/calendario', label: 'Calendario', Icon: CalendarDays },
  { to: '/mas', label: 'Más', Icon: Menu },
]

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
