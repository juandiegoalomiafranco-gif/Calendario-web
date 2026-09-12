import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Resumen', emoji: '💰' },
  { to: '/movimientos', label: 'Movimientos', emoji: '🧾' },
  { to: '/presupuesto', label: 'Presupuesto', emoji: '🎚️' },
  { to: '/metas', label: 'Metas', emoji: '🎯' },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)] bg-transparent"
    >
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between bg-card shadow-card rounded-full px-1.5 py-1.5">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                // ink-500 en vez del ink-400 anterior: ink-400 sobre bg-card daba
                // ~4.2:1, por debajo del mínimo AA para texto pequeño.
                `flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium transition-colors min-h-[48px] ${
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-500'
                }`
              }
            >
              <span className="text-base leading-none" aria-hidden>
                {item.emoji}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
