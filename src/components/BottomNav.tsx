import { NavLink } from 'react-router-dom'
import { SunIcon, CalendarIcon, TrendingUpIcon, SlidersIcon } from './icons'

const ITEMS = [
  { to: '/', label: 'Hoy', Icon: SunIcon },
  { to: '/semana', label: 'Semana', Icon: CalendarIcon },
  { to: '/progreso', label: 'Progreso', Icon: TrendingUpIcon },
  { to: '/ajustes', label: 'Ajustes', Icon: SlidersIcon },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)] bg-transparent">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between bg-card rounded-full shadow-card px-2 py-2">
          {ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
