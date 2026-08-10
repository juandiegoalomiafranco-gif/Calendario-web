import { CalendarDays, Settings, Sun, TrendingUp, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
  /** Sólo la ruta exacta marca activo (para "/"). */
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Hoy', Icon: Sun, end: true },
  { to: '/calendario', label: 'Calendario', Icon: CalendarDays },
  { to: '/progreso', label: 'Progreso', Icon: TrendingUp },
  { to: '/ajustes', label: 'Ajustes', Icon: Settings },
]
