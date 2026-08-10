import { NavLink } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { NAV_ITEMS } from './navItems'

/** Navegación flotante de móvil. En escritorio la sustituye la barra lateral. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface/85 p-1.5 shadow-lg backdrop-blur-xl">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[11px] font-medium transition-colors',
                  isActive ? 'bg-brand text-brand-on' : 'text-content-muted',
                )
              }
            >
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
