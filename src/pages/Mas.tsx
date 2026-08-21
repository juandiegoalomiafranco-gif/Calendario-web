import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  CircleUser,
  ListChecks,
  Notebook,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ThemeToggle } from '../components/ui/ThemeToggle'

interface HubLink {
  to: string
  Icon: LucideIcon
  label: string
  caption: string
  tone: string
}

const LINKS: HubLink[] = [
  { to: '/clases', Icon: Notebook, label: 'Clases', caption: 'Próximas clases, tareas y exámenes', tone: 'bg-cat-soft-blue text-cat-blue' },
  { to: '/pendientes', Icon: ListChecks, label: 'Pendientes', caption: 'Todo lo que tienes por hacer', tone: 'bg-cat-soft-rose text-cat-rose' },
  { to: '/calendario', Icon: CalendarDays, label: 'Calendario', caption: 'Eventos y fechas importantes', tone: 'bg-cat-soft-violet text-cat-violet' },
  { to: '/finanzas', Icon: Wallet, label: 'Finanzas', caption: 'Cuentas, gastos y ahorro', tone: 'bg-cat-soft-green text-cat-green' },
  { to: '/cuerpo', Icon: CircleUser, label: 'Progreso corporal', caption: 'Controles, metas y tendencias', tone: 'bg-cat-soft-teal text-cat-teal' },
  { to: '/progreso', Icon: TrendingUp, label: 'Estadísticas de entreno', caption: 'Constancia, tiempo y frecuencia cardíaca', tone: 'bg-cat-soft-orange text-cat-orange' },
  { to: '/ajustes', Icon: Settings, label: 'Ajustes', caption: 'Cuenta, avisos y zonas de entreno', tone: 'bg-cat-soft-slate text-cat-slate' },
]

/** Índice de secciones para móvil. En escritorio el rail de iconos lleva a todo. */
export function Mas() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Todas las secciones" title="Más" />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-lg"
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${l.tone}`}>
              <l.Icon size={19} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-content">{l.label}</p>
              <p className="truncate text-xs text-content-muted">{l.caption}</p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-content-subtle" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card">
        <p className="text-sm font-semibold text-content">Tema</p>
        <ThemeToggle />
      </div>
    </div>
  )
}
