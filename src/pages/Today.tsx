import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useSchoolConfig, useTasks } from '../hooks/useSchool'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { useSchoolDay } from '../hooks/useSchoolDay'
import { cycleInfoFor, nextSchoolDay } from '../lib/cycle'
import {
  addDays,
  daysBetween,
  dayNumber,
  esFechaIso,
  formatMonthYear,
  hora12,
  nowMinutes,
  todayIso,
  weekdayLong,
} from '../lib/dates'
import { MAS_ITEM } from '../components/layout/navItems'
import { WeekStrip } from '../components/inicio/WeekStrip'
import { ColegioCard } from '../components/inicio/ColegioCard'
import { DaySchedule, DayScheduleSheet } from '../components/inicio/DaySchedule'
import { FinanzasResumen, LoProximo, ParaElDia } from '../components/inicio/ResumenInicio'

/** Desde esta hora (Colombia) el Inicio pasa a «fin del día» y muestra lo de mañana. */
const HORA_NOCHE = 20 * 60

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

function saludo(min: number): string {
  if (min >= HORA_NOCHE) return 'Buenas noches'
  if (min >= 12 * 60) return 'Buenas tardes'
  return 'Buenos días'
}

/**
 * Inicio: arriba la tira de días (tocar un día cambia toda la pantalla a ese día) y la
 * tarjeta del colegio; debajo lo que hay que hacer, lo próximo y las finanzas.
 *
 * En el celular el horario minuto a minuto se abre en un panel; en el computador se
 * ve siempre, en la columna izquierda. Desde las 8 pm la pantalla arranca en el
 * siguiente día de colegio: es el que toca preparar.
 */
export function Today() {
  const hoy = todayIso()
  const minutos = nowMinutes()
  const noche = minutos >= HORA_NOCHE
  const { config } = useSchoolConfig()
  const { tasks } = useTasks()
  const { events } = useCalendarEvents()
  const [params, setParams] = useSearchParams()
  const [horarioAbierto, setHorarioAbierto] = useState(false)

  const porDefecto = noche ? (nextSchoolDay(hoy, config)?.date ?? addDays(hoy, 1)) : hoy
  const pedido = params.get('d')
  const dia = esFechaIso(pedido) ? pedido : porDefecto

  function elegir(iso: string) {
    // `replace`: moverse por la tira no debe llenar el historial del botón «atrás».
    if (iso === porDefecto) setParams({}, { replace: true })
    else setParams({ d: iso }, { replace: true })
  }

  const diff = daysBetween(hoy, dia)
  const relativo = diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : null
  const titulo = relativo
    ? `${mayuscula(relativo)}, ${weekdayLong(dia)} ${dayNumber(dia)}`
    : `${mayuscula(weekdayLong(dia))} ${dayNumber(dia)}`
  const de = relativo ? `de ${relativo}` : `del ${weekdayLong(dia)}`
  const paraTitulo = relativo ? `Para ${relativo}` : `Para el ${weekdayLong(dia)}`

  const { cycle, classes } = useSchoolDay(dia)
  const resumenDia = cycle.schoolDay
    ? `Día ${cycle.cycleDay} · ${classes.length} clases${classes.length ? ` · sales a las ${hora12(classes[classes.length - 1].end)}` : ''}`
    : (cycle.reason ?? 'Sin clases')

  const ocupados = useMemo(() => {
    const s = new Set<string>()
    for (const t of tasks) if (!t.done && t.dueDate) s.add(t.dueDate)
    for (const e of events) s.add(e.date)
    return s
  }, [tasks, events])

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header className="flex items-center gap-3 lg:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-caption font-medium text-content-muted lg:text-sm">
            {formatMonthYear(dia)} · {saludo(minutos)}
            <span className="hidden lg:inline">, Juan Diego</span>
          </p>
          <h1 className="truncate text-title text-content lg:text-[32px] lg:leading-[38px]">{titulo}</h1>
        </div>
        <Link
          to="/pendientes"
          className="hidden h-11 w-[300px] items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-content-subtle transition-colors hover:text-content lg:inline-flex"
        >
          <Search size={16} aria-hidden />
          Buscar tarea, clase o evento…
        </Link>
        <button
          type="button"
          onClick={() => elegir(hoy)}
          className="h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-2"
        >
          Hoy
        </button>
        <Link
          to={MAS_ITEM.to}
          aria-label={MAS_ITEM.label}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-content lg:hidden"
        >
          <MAS_ITEM.Icon size={19} aria-hidden />
        </Link>
      </header>

      <WeekStrip
        selected={dia}
        today={hoy}
        onSelect={elegir}
        ocupado={(d) => ocupados.has(d)}
        sinClase={(d) => !cycleInfoFor(d, config).schoolDay}
        etiqueta={(d) => {
          const c = cycleInfoFor(d, config)
          return c.cycleDay ? `Día ${c.cycleDay}` : 'Descanso'
        }}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ColegioCard
            date={dia}
            noche={noche}
            onVerHorario={() => setHorarioAbierto(true)}
            etiquetaBoton={`Ver horario ${de}`}
            onIrA={elegir}
          />

          {/* En el computador el horario se ve siempre; en el celular va en el panel. */}
          {cycle.schoolDay && (
            <section className="hidden flex-col gap-3 rounded-3xl border border-line bg-surface px-6 py-5 lg:flex">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-section text-content">Horario {de}</h2>
                <p className="text-caption text-content-muted">
                  Toca una clase para añadirle una tarea, un examen o ver sus notas.
                </p>
              </div>
              <DaySchedule date={dia} />
            </section>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <ParaElDia date={dia} titulo={paraTitulo} />
          <LoProximo />
          <FinanzasResumen />
        </div>
      </div>

      <DayScheduleSheet
        open={horarioAbierto}
        onClose={() => setHorarioAbierto(false)}
        date={dia}
        titulo={`Horario ${de}`}
        subtitulo={resumenDia}
      />
    </div>
  )
}
