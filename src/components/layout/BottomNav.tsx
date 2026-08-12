import { NavLink } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { MOBILE_ITEMS } from './navItems'

/** Navegación de móvil. En escritorio la sustituye el rail de iconos. */
export function BottomNav() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between gap-1 rounded-full border border-line bg-surface/90 p-1.5 shadow-lg backdrop-blur-xl">
          {MOBILE_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-semibold transition-colors',
                  isActive ? 'bg-primary text-primary-on' : 'text-content-subtle',
                )
              }
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
