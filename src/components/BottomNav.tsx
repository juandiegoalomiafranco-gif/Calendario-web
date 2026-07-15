import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Hoy', emoji: '☀️' },
  { to: '/semana', label: 'Semana', emoji: '🗓️' },
  { to: '/progreso', label: 'Progreso', emoji: '📈' },
  { to: '/ajustes', label: 'Ajustes', emoji: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)] bg-transparent">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between bg-card border border-ink-100 rounded-full shadow-card px-2 py-2">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-500'
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
