import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { todayISO } from '../data/plan'
import type { Session } from '../data/types'
import { useIsDesktop } from '../hooks/useMediaQuery'
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatRangeTitle,
  formatDayMonth,
  isSameMonth,
  monthMatrix,
  weekDays,
  weekdayLong,
} from '../lib/dates'
import { clampToPlan } from '../lib/planQuery'
import { cx } from '../lib/cx'
import { AgendaList } from '../components/calendar/AgendaList'
import { ActivityFilterChips } from '../components/calendar/ActivityFilters'
import { MiniCalendar } from '../components/calendar/MiniCalendar'
import { MonthGrid } from '../components/calendar/MonthGrid'
import { SessionPanel } from '../components/calendar/SessionPanel'
import { WeekTimeGrid } from '../components/calendar/WeekTimeGrid'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'

type View = 'day' | 'week' | 'month'

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

const VIEW_KEY = 'calendario-web:view:v1'

function readView(): View {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw === 'day' || raw === 'week' || raw === 'month') return raw
  } catch {
    // sin acceso a localStorage: se usa el valor por defecto de abajo
  }
  // En escritorio la semana es la vista natural; en móvil, el día.
  return typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'week' : 'day'
}

export function Calendar() {
  const today = todayISO()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>(readView)
  const [selected, setSelected] = useState<{ session: Session; date: string } | null>(null)

  // Si hoy queda fuera del plan, abrimos en el extremo más cercano en vez de en un rango vacío
  const focused = params.get('d') ?? clampToPlan(today)

  // La fecha va siempre en la URL: así "Hoy" funciona incluso cuando hoy cae
  // fuera del plan y el valor por defecto es la fecha acercada.
  const setFocused = useCallback(
    (date: string) => setParams({ d: date }, { replace: true }),
    [setParams],
  )

  const changeView = (next: View) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // modo privado: la vista simplemente no se recuerda entre sesiones
    }
  }

  const gridDays = useMemo(() => {
    if (view === 'day') return [focused]
    if (view === 'week') return weekDays(focused)
    return monthMatrix(focused).flat()
  }, [view, focused])

  /** En la agenda de móvil el mes muestra sólo sus propios días, sin el relleno. */
  const agendaDays = useMemo(
    () => (view === 'month' ? gridDays.filter((d) => isSameMonth(d, focused)) : gridDays),
    [view, gridDays, focused],
  )

  const title =
    view === 'day'
      ? `${weekdayLong(focused)}, ${formatDayMonth(focused)}`
      : view === 'week'
        ? formatRangeTitle(gridDays[0], gridDays[gridDays.length - 1])
        : formatMonthYear(focused)

  const step = (dir: 1 | -1) => {
    if (view === 'month') setFocused(addMonths(focused, dir))
    else setFocused(addDays(focused, dir * (view === 'week' ? 7 : 1)))
  }

  const onSelect = useCallback(
    (session: Session, date: string) => {
      // En escritorio el detalle se abre al lado; en móvil se navega a la página del día.
      if (isDesktop) setSelected({ session, date })
      else navigate(`/dia/${date}/${session.id}`)
    },
    [isDesktop, navigate],
  )

  const panelOpen = Boolean(selected) && isDesktop

  return (
    // Con el panel abierto el contenido se estrecha para que no quede nada tapado debajo
    <div
      className={cx(
        'flex flex-col gap-4 transition-[padding] duration-200 lg:gap-5',
        panelOpen && 'lg:pr-[396px]',
      )}
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold first-letter:uppercase tracking-tight text-content lg:text-2xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" onClick={() => step(-1)} aria-label="Anterior">
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFocused(today)}>
              Hoy
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => step(1)} aria-label="Siguiente">
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>

          <SegmentedControl
            options={VIEW_OPTIONS}
            value={view}
            onChange={changeView}
            ariaLabel="Vista del calendario"
          />

          <Button
            size="sm"
            variant="primary"
            className="hidden xl:inline-flex"
            onClick={() => navigate(`/dia/${focused}`)}
          >
            <Plus size={16} aria-hidden />
            Registrar entreno
          </Button>
        </div>
      </header>

      {/* Escritorio: rejilla horaria (día y semana) o rejilla de mes */}
      <div className="hidden lg:block">
        {view === 'month' ? (
          <MonthGrid
            month={focused}
            todayIso={today}
            selected={focused}
            onSelectDay={setFocused}
            onSelect={onSelect}
          />
        ) : (
          <WeekTimeGrid days={gridDays} todayIso={today} onSelect={onSelect} />
        )}
      </div>

      {/* Móvil y tablet: mini-calendario + filtros + agenda */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-card">
          <MiniCalendar value={focused} todayIso={today} onSelect={setFocused} />
        </div>

        <ActivityFilterChips />

        <div className="flex items-center gap-2 text-sm font-semibold text-content">
          <CalendarDays size={16} className="text-content-muted" aria-hidden />
          {view === 'day'
            ? `Sesiones del ${formatDayMonth(focused)}`
            : view === 'week'
              ? `Sesiones del ${formatRangeTitle(gridDays[0], gridDays[gridDays.length - 1])}`
              : `Sesiones de ${formatMonthYear(focused).toLowerCase()}`}
        </div>

        <AgendaList days={agendaDays} todayIso={today} onSelect={onSelect} />
      </div>

      {panelOpen && selected && (
        <SessionPanel
          session={selected.session}
          date={selected.date}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
