import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, GraduationCap } from 'lucide-react'
import { PERSONAL_AREA_META, TASK_KIND_META, type Task } from '../../data/schoolTypes'
import { colorOf } from '../../data/palette'
import { useSchoolSetup, useTasks } from '../../hooks/useSchool'
import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import { useFinance } from '../../hooks/useFinance'
import { daysBetween, formatFull, relativeDay, todayIso, weekdayLong } from '../../lib/dates'
import { formatCOP, monthKey, rendimientoEA } from '../../lib/finance'
import { cx } from '../../lib/cx'

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Encabezado de sección del Inicio: título a la izquierda y un enlace a la derecha. */
function Encabezado({ titulo, to, enlace }: { titulo: string; to?: string; enlace?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-section text-content">{titulo}</h2>
      {to && enlace && (
        <Link to={to} className="text-sm font-medium text-content-muted hover:text-content">
          {enlace}
        </Link>
      )}
    </div>
  )
}

/**
 * «Para hoy» (o «Para mañana», «Para el viernes»): lo que vence el día elegido, en
 * tarjetas con un círculo para marcarlo hecho. Lo marcado se queda visible, tachado,
 * hasta salir de la pantalla: si desapareciera al instante no se vería qué se tocó.
 */
export function ParaElDia({ date, titulo }: { date: string; titulo: string }) {
  const hoy = todayIso()
  const { tasks, toggleTask } = useTasks()
  const { setup } = useSchoolSetup()
  const [recienHechas, setRecienHechas] = useState<Set<string>>(() => new Set())

  const lista = useMemo(() => {
    const delDia = tasks.filter(
      (t) =>
        (!t.done || recienHechas.has(t.id)) &&
        (t.dueDate === date || (date === hoy && !!t.dueDate && t.dueDate < hoy)),
    )
    // Lo vencido primero, luego por urgencia.
    return delDia.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).slice(0, 5)
  }, [tasks, date, hoy, recienHechas])

  function marcar(t: Task) {
    setRecienHechas((prev) => {
      const next = new Set(prev)
      if (!t.done) next.add(t.id)
      return next
    })
    toggleTask(t.id)
  }

  return (
    <section className="flex flex-col gap-2.5">
      <Encabezado titulo={titulo} to="/pendientes" enlace="Ver todo" />
      {lista.map((t) => {
        const personal = t.scope === 'personal'
        const cls = t.classCode ? setup.classes[t.classCode] : undefined
        const franja = personal
          ? (PERSONAL_AREA_META[t.area ?? 'otro'] ?? PERSONAL_AREA_META.otro).color.dot
          : cls
            ? colorOf(cls.color).dot
            : 'bg-line-strong'
        const tipo = (TASK_KIND_META[t.kind] ?? TASK_KIND_META.tarea).label
        const meta = personal
          ? `Personal · ${(PERSONAL_AREA_META[t.area ?? 'otro'] ?? PERSONAL_AREA_META.otro).label}`
          : `${cls?.name ?? 'Colegio'} · ${tipo}`
        const vencida = !!t.dueDate && t.dueDate < hoy
        const etiqueta = t.done
          ? 'Hecho'
          : vencida
            ? 'Vencida'
            : t.dueDate === hoy
              ? 'Hoy'
              : daysBetween(hoy, t.dueDate ?? hoy) === 1
                ? 'Mañana'
                : mayuscula(weekdayLong(t.dueDate ?? hoy))
        return (
          <div
            key={t.id}
            className="flex min-h-16 items-center gap-3 rounded-[18px] border border-line bg-surface px-3.5 py-3"
          >
            {/* El botón mide 44 px (zona táctil); el círculo de 28 va dentro. Si el
                círculo fuera el botón, la regla de 44 px del celular lo volvía un óvalo. */}
            <button
              type="button"
              onClick={() => marcar(t)}
              aria-pressed={t.done}
              aria-label={t.done ? `Desmarcar: ${t.title}` : `Marcar como hecho: ${t.title}`}
              className="group -m-2 grid h-11 w-11 shrink-0 place-items-center rounded-full"
            >
              <span
                className={cx(
                  'grid h-7 w-7 place-items-center rounded-full border-2 transition-colors',
                  t.done
                    ? 'border-brand bg-brand text-brand-on'
                    : 'border-line-strong bg-surface group-hover:border-content-muted',
                )}
              >
                {t.done && <Check size={14} strokeWidth={3} aria-hidden />}
              </span>
            </button>
            <span aria-hidden className={cx('h-9 w-1 shrink-0 rounded-full', franja)} />
            <span className="min-w-0 flex-1">
              <span
                className={cx(
                  'block truncate text-body font-semibold',
                  t.done ? 'text-content-subtle line-through' : 'text-content',
                )}
              >
                {t.title}
              </span>
              <span className="block truncate text-caption text-content-muted">{meta}</span>
            </span>
            <span
              className={cx(
                'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                t.done
                  ? 'bg-ok-soft text-ok'
                  : vencida || t.dueDate === hoy
                    ? 'bg-danger-soft text-danger'
                    : 'bg-surface-2 text-content-muted',
              )}
            >
              {etiqueta}
            </span>
          </div>
        )
      })}
      {lista.length === 0 && (
        <p className="rounded-[18px] border border-dashed border-line-strong p-4 text-center text-sm text-content-muted">
          Nada pendiente para este día.
        </p>
      )}
    </section>
  )
}

/** «Lo próximo»: el examen más cercano y el próximo evento, con su cuenta atrás. */
export function LoProximo() {
  const hoy = todayIso()
  const { tasks } = useTasks()
  const { setup } = useSchoolSetup()
  const { events } = useCalendarEvents()

  const examen = tasks
    .filter((t) => !t.done && (t.kind === 'examen' || t.kind === 'quiz') && !!t.dueDate && t.dueDate >= hoy)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0]
  const evento = events
    .filter((e) => e.date >= hoy)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))[0]

  const filas = [
    examen && {
      key: 'examen',
      to: '/pendientes',
      Icon: GraduationCap,
      tono: 'bg-cat-soft-rose text-cat-rose',
      titulo: examen.title,
      detalle: `${examen.classCode ? (setup.classes[examen.classCode]?.name ?? 'Colegio') : 'Colegio'} · ${mayuscula(formatFull(examen.dueDate!))}`,
      cuenta: relativeDay(examen.dueDate!, hoy),
      tonoCuenta: 'bg-cat-soft-rose text-cat-rose',
    },
    evento && {
      key: 'evento',
      to: `/calendario?d=${evento.date}`,
      Icon: CalendarDays,
      tono: 'bg-cat-soft-violet text-cat-violet',
      titulo: evento.title,
      detalle: `${mayuscula(formatFull(evento.date))}${evento.time ? ` · ${evento.time}` : ''}`,
      cuenta: relativeDay(evento.date, hoy),
      tonoCuenta: 'bg-cat-soft-violet text-cat-violet',
    },
  ].filter(Boolean) as {
    key: string
    to: string
    Icon: typeof GraduationCap
    tono: string
    titulo: string
    detalle: string
    cuenta: string
    tonoCuenta: string
  }[]

  return (
    <section className="flex flex-col gap-2.5">
      <Encabezado titulo="Lo próximo" />
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
        {filas.map((f, i) => (
          <Link
            key={f.key}
            to={f.to}
            className={cx(
              'flex min-h-16 items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-2',
              i > 0 && 'border-t border-line',
            )}
          >
            <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full', f.tono)}>
              <f.Icon size={18} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-content">{f.titulo}</span>
              <span className="block truncate text-caption text-content-muted">{f.detalle}</span>
            </span>
            <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', f.tonoCuenta)}>
              {f.cuenta}
            </span>
          </Link>
        ))}
        {filas.length === 0 && (
          <p className="p-4 text-center text-sm text-content-muted">Ni exámenes ni eventos a la vista.</p>
        )}
      </div>
    </section>
  )
}

/**
 * Finanzas en el Inicio: mi plata (sin la de mis papás), lo que rinde, lo que entró y
 * salió este mes, lo que pagaron mis papás y las deudas pendientes.
 */
export function FinanzasResumen() {
  const hoy = todayIso()
  const { accounts, transactions, debts } = useFinance()

  const r = useMemo(() => {
    const mes = monthKey(hoy)
    let plata = 0
    let rinde = 0
    for (const a of accounts) {
      if (a.kind === 'externa') continue
      plata += a.balance
      if (a.interestPct) rinde += rendimientoEA(a.balance, a.interestPct).mensual
    }
    let ingresos = 0
    let gastos = 0
    let papas = 0
    for (const t of transactions) {
      if (monthKey(t.date) !== mes) continue
      if (t.source === 'papas') {
        if (t.kind === 'gasto') papas += t.amount
      } else if (t.kind === 'ingreso') ingresos += t.amount
      else gastos += t.amount
    }
    let meDeben = 0
    let debo = 0
    for (const d of debts) {
      if (d.paidAt) continue
      if (d.direction === 'me_deben') meDeben += d.amount
      else debo += d.amount
    }
    return { plata, rinde, ingresos, gastos, papas, meDeben, debo }
  }, [accounts, transactions, debts, hoy])

  return (
    <section className="flex flex-col gap-2.5">
      <Encabezado titulo="Finanzas" to="/finanzas" enlace="Ver finanzas" />
      <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption text-content-muted">Mi plata disponible</p>
            <p className="text-[28px] font-medium leading-[34px] tracking-tight tabular text-content">
              {formatCOP(r.plata)}
            </p>
          </div>
          {r.rinde > 0 && (
            <p className="text-right text-caption font-semibold text-ok">
              Rinde ≈ {formatCOP(r.rinde)}
              <br />
              al mes
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-ok-soft px-3 py-2.5">
            <p className="text-xs font-semibold text-ok">Ingresos del mes</p>
            <p className="text-body font-semibold tabular text-content">{formatCOP(r.ingresos)}</p>
          </div>
          <div className="rounded-[14px] bg-danger-soft px-3 py-2.5">
            <p className="text-xs font-semibold text-danger">Gastos del mes</p>
            <p className="text-body font-semibold tabular text-content">{formatCOP(r.gastos)}</p>
          </div>
        </div>
        <div className="h-px bg-line" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption text-content-muted">Plata de mis papás este mes</span>
          <span className="text-body font-semibold tabular text-content">{formatCOP(r.papas)}</span>
        </div>
        {(r.meDeben > 0 || r.debo > 0) && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-caption text-content-muted">Me deben · Debo</span>
            <span className="text-body font-semibold tabular">
              <span className="text-ok">{formatCOP(r.meDeben)}</span>
              <span className="text-content-muted"> · </span>
              <span className="text-danger">{formatCOP(r.debo)}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
