import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/cuerpo', emoji: '📊', label: 'Progreso corporal', caption: 'Controles, metas y tendencias' },
  { to: '/finanzas', emoji: '💰', label: 'Finanzas', caption: 'Cuentas, gastos y ahorro' },
  { to: '/calendario', emoji: '📅', label: 'Calendario', caption: 'Mes, agenda y fechas importantes' },
  { to: '/pendientes', emoji: '✅', label: 'Pendientes', caption: 'Tareas por urgencia y fecha' },
  { to: '/semana', emoji: '🗓️', label: 'Semana', caption: 'Plan de entrenamiento' },
  { to: '/progreso', emoji: '📈', label: 'Estadísticas de entreno', caption: 'Km, ritmo, FC' },
  { to: '/ajustes', emoji: '⚙️', label: 'Ajustes', caption: 'PIN, FC y ritmo' },
]

export function Mas() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 font-display">Más</h1>
      </header>
      <div className="flex flex-col gap-2.5">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-3xl bg-card shadow-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
            <span className="text-2xl" aria-hidden>{l.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-ink-900">{l.label}</p>
              <p className="text-xs text-ink-500">{l.caption}</p>
            </div>
            <span className="text-ink-400" aria-hidden>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
