import {
  CalendarDays,
  CircleUser,
  Dumbbell,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Menu,
  Notebook,
  Settings,
  Utensils,
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
  { to: '/entreno', label: 'Entreno', Icon: Dumbbell },
  { to: '/comida', label: 'Comida', Icon: Utensils },
  { to: '/finanzas', label: 'Finanzas', Icon: Wallet },
]

/** Pie del rail: ajustes y perfil. */
export const NAV_FOOTER: NavItem[] = [
  { to: '/cuerpo', label: 'Cuerpo', Icon: CircleUser },
  { to: '/ajustes', label: 'Ajustes', Icon: Settings },
]

/** Las cinco pestañas de la barra inferior en móvil. */
export const MOBILE_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: LayoutGrid, end: true },
  { to: '/colegio', label: 'Colegio', Icon: GraduationCap },
  { to: '/entreno', label: 'Entreno', Icon: Dumbbell },
  { to: '/comida', label: 'Comida', Icon: Utensils },
  { to: '/mas', label: 'Más', Icon: Menu },
]
