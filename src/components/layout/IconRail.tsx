import { NavLink } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { NAV_FOOTER, NAV_ITEMS, type NavItem } from './navItems'

function RailLink({ to, label, Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        cx(
          'group relative grid h-11 w-11 place-items-center rounded-2xl transition-colors duration-150',
          isActive
            ? 'bg-primary text-primary-on'
            : 'text-content-subtle hover:bg-surface-2 hover:text-content',
        )
      }
    >
      <Icon size={19} strokeWidth={1.9} aria-hidden />
      {/* Etiqueta flotante: el rail se mantiene minimalista pero nada queda sin nombre */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-on opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block"
      >
        {label}
      </span>
    </NavLink>
  )
}

/** Rail de iconos de escritorio: minimalista, sin fondo de tarjeta, activo en grafito. */
export function IconRail() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center gap-1 border-r border-line bg-surface py-4 lg:flex"
    >
      <div className="scroll-slim flex flex-1 flex-col items-center gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <RailLink key={item.to} {...item} />
        ))}
      </div>

      <div className="mt-2 flex flex-col items-center gap-1 border-t border-line pt-3">
        {NAV_FOOTER.map((item) => (
          <RailLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}
