import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { useSyncStatus } from '../lib/syncStatus'

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Hoy', icon: 'hoy' },
  { to: '/semana', label: 'Semana', icon: 'semana' },
  { to: '/metas', label: 'Metas', icon: 'meta' },
  { to: '/progreso', label: 'Progreso', icon: 'progreso' },
  { to: '/ajustes', label: 'Ajustes', icon: 'ajustes' },
]

export function BottomNav() {
  const { state } = useSyncStatus()
  const offline = state === 'sin-conexion'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)] bg-transparent">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="flex items-center justify-between bg-card rounded-full shadow-card px-2 py-2">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-ink-400'
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
              {offline && item.to === '/ajustes' && (
                <span
                  className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-amber-400"
                  title="Sin conexión con la nube"
                />
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
