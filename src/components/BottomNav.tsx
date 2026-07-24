import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Hoy', emoji: '☀️' },
  { to: '/colegio', label: 'Colegio', emoji: '🎓' },
  { to: '/entreno', label: 'Entreno', emoji: '🏃' },
  { to: '/comida', label: 'Comida', emoji: '🍎' },
  { to: '/mas', label: 'Más', emoji: '☰' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)] bg-transparent">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between bg-card rounded-full shadow-card px-1.5 py-2">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-400'
                }`
              }
            >
              <span className="text-base leading-none">{item.emoji}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
