import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { GOAL_DATE, GOAL_DISTANCE_KM, todayISO } from '../../data/plan'
import { ACTIVITIES, activityKeyOf } from '../../data/activityMeta'
import { clampToPlan, keySessions } from '../../lib/planQuery'
import { daysBetween, formatShort } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { MiniCalendar } from '../calendar/MiniCalendar'
import { ActivityFilterList } from '../calendar/ActivityFilters'
import { ProgressRing } from '../ProgressRing'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NAV_ITEMS } from './navItems'

function SidebarHeading({ children }: { children: string }) {
  return (
    <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-content-subtle">
      {children}
    </p>
  )
}

/** Barra lateral de escritorio: navegación, mini-calendario, filtros y meta. */
export function Sidebar({ completionPct }: { completionPct: number }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const today = todayISO()
  const focused = params.get('d') ?? clampToPlan(today)
  const daysToGoal = daysBetween(today, GOAL_DATE)
  const key = keySessions()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-on">
          <Flag size={17} strokeWidth={2.5} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-content">
            Mi Calendario
          </span>
          <span className="block truncate text-xs text-content-muted">
            Plan {GOAL_DISTANCE_KM} K · 5 de agosto
          </span>
        </span>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-3 pb-4">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-content-muted hover:bg-surface-2 hover:text-content',
                )
              }
            >
              <Icon size={17} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <hr className="my-4 border-line" />

        <MiniCalendar
          value={focused}
          todayIso={today}
          onSelect={(date) => navigate(`/calendario?d=${date}`)}
          className="px-1"
        />

        <hr className="my-4 border-line" />

        <SidebarHeading>Mis actividades</SidebarHeading>
        <ActivityFilterList />

        {key.length > 0 && (
          <>
            <hr className="my-4 border-line" />
            <SidebarHeading>Sesiones clave</SidebarHeading>
            <ul className="flex flex-col gap-0.5">
              {key.map(({ date, session }) => {
                const activity = ACTIVITIES[activityKeyOf(session.type)]
                return (
                  <li key={session.id}>
                    <NavLink
                      to={`/calendario?d=${date}`}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2"
                    >
                      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', activity.dot)} />
                      <span className="min-w-0 flex-1 truncate text-sm text-content">
                        {session.summary}
                      </span>
                      <span className="shrink-0 text-xs text-content-subtle">{formatShort(date)}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <ProgressRing value={completionPct} size={52} strokeWidth={6}>
            <span className="text-[11px] font-bold tabular text-content">{completionPct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content">Meta {GOAL_DISTANCE_KM} km</p>
            <p className="truncate text-xs text-content-muted">
              {daysToGoal > 0
                ? `faltan ${daysToGoal} ${daysToGoal === 1 ? 'día' : 'días'}`
                : daysToGoal === 0
                  ? '¡Es hoy!'
                  : 'plan completado'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  )
}
