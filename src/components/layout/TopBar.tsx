import { Link } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import { todayIso, weekdayLong } from '../../lib/dates'
import { useTasks } from '../../hooks/useSchool'
import { cx } from '../../lib/cx'
import { ThemeToggle } from '../ui/ThemeToggle'
import { SyncIndicator } from '../SyncIndicator'

/** Logotipo de MyLife: el mismo mosaico del icono de la app. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('flex items-center gap-2', className)}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary">
        <span className="grid grid-cols-2 gap-[3px]">
          <span className="h-[6px] w-[6px] rounded-[2px] bg-primary-on" />
          <span className="h-[6px] w-[6px] rounded-[2px] bg-accent" />
          <span className="h-[6px] w-[6px] rounded-[2px] bg-accent" />
          <span className="h-[6px] w-[6px] rounded-[2px] bg-primary-on/45" />
        </span>
      </span>
      <span className="text-[17px] font-extrabold leading-none tracking-tight text-content">
        MyLife
      </span>
    </span>
  )
}

/**
 * Barra superior de escritorio: marca a la izquierda, acciones y perfil a la derecha.
 * Sigue la organización de la referencia, adaptada a lo que MyLife necesita.
 */
export function TopBar() {
  const { tasks } = useTasks()
  const today = todayIso()
  const dueSoon = tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= today).length

  return (
    <header className="sticky top-0 z-20 hidden border-b border-line bg-bg/85 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <Link to="/" aria-label="Ir al inicio">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2">
          <SyncIndicator />
          <ThemeToggle compact />

          <Link
            to="/pendientes"
            aria-label={dueSoon > 0 ? `${dueSoon} pendientes para hoy` : 'Pendientes'}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-content-muted transition-colors hover:text-content"
          >
            <Bell size={17} aria-hidden />
            {dueSoon > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </Link>

          <Link
            to="/ajustes"
            aria-label="Ajustes"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-content-muted transition-colors hover:text-content"
          >
            <Settings size={17} aria-hidden />
          </Link>

          <div className="ml-1 flex items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-white">
              JD
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-bold text-content">Juan Diego</span>
              <span className="block text-[11px] capitalize text-content-subtle">
                {weekdayLong(today)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
