import { ChevronUp } from 'lucide-react'
import { useNextSchoolDay, useNowAndNext, useSchoolDay } from '../../hooks/useSchoolDay'
import { useSchoolConfig } from '../../hooks/useSchool'
import { nextSchoolDay } from '../../lib/cycle'
import { classesOnly, resolveDay } from '../../lib/school'
import { hora12, nowMinutes, todayIso, weekdayLong, dayNumber, MONTHS, monthIndex } from '../../lib/dates'
import { useSchoolSetup } from '../../hooks/useSchool'
import { cx } from '../../lib/cx'

interface ColegioCardProps {
  /** Día elegido en la tira. */
  date: string
  /** Desde las 8 pm: la tarjeta habla de mañana («Por hoy terminaste»). */
  noche: boolean
  /** Celular: abre el panel del horario. En el computador el horario ya se ve al lado. */
  onVerHorario?: () => void
  etiquetaBoton?: string
  /** Para el día de descanso: saltar al siguiente día de colegio. */
  onIrA?: (iso: string) => void
}

function fechaCorta(iso: string): string {
  return `${weekdayLong(iso)} ${dayNumber(iso)} ${MONTHS[monthIndex(iso)].slice(0, 3)}`
}

/**
 * La tarjeta negra del colegio: qué día del ciclo es, cuántas clases y a qué hora se
 * sale, y lo que está pasando ahora (o la primera clase, si es otro día). Reemplaza
 * la línea «Día 4 · 7 clases» y el botón blanco, que no se veían bien.
 */
export function ColegioCard({ date, noche, onVerHorario, etiquetaBoton, onIrA }: ColegioCardProps) {
  const hoy = todayIso()
  const { cycle, classes } = useSchoolDay(date)
  const { config } = useSchoolConfig()
  const { setup } = useSchoolSetup()
  const enVivo = date === hoy && !noche
  const { current, next } = useNowAndNext(hoy, true)
  const siguienteDia = useNextSchoolDay(date)

  const esManana = noche && date === nextSchoolDay(hoy, config)?.date
  const etiqueta = !cycle.schoolDay
    ? `Descanso · ${cycle.reason ?? 'sin colegio'}`
    : enVivo
      ? 'Colegio hoy'
      : esManana
        ? 'Por hoy terminaste · lo que viene'
        : `Colegio · ${fechaCorta(date)}`

  // Advisory dura diez minutos: como «primera clase» sirve más la primera materia.
  const materias = classes.filter((c) => c.period !== 'Adv')
  const [primera, segunda] = materias.length > 0 ? materias : classes

  // Lo que se muestra a la derecha: la clase de ahora y la que sigue (hoy), o la
  // primera y la segunda del día elegido.
  const terminadas = enVivo ? classes.filter((c) => c.endMin <= nowMinutes()).length : 0
  const bloque1 = enVivo
    ? current
      ? { titulo: 'Ahora', clase: current, meta: `${current.room ? `${current.room} · ` : ''}hasta ${current.end}` }
      : next
        ? { titulo: 'Sigue', clase: next, meta: `${next.start}${next.room ? ` · ${next.room}` : ''}` }
        : null
    : primera
      ? { titulo: 'Primera clase', clase: primera, meta: `${primera.start}${primera.room ? ` · ${primera.room}` : ''}` }
      : null
  const bloque2 = enVivo
    ? current && next
      ? { titulo: 'Sigue', clase: next, meta: `${next.start}${next.room ? ` · ${next.room}` : ''}` }
      : null
    : segunda
      ? { titulo: 'Después', clase: segunda, meta: `${segunda.start}${segunda.room ? ` · ${segunda.room}` : ''}` }
      : null

  const salida = classes.length > 0 ? hora12(classes[classes.length - 1].end) : null

  // Día sin clases: lo útil es el siguiente día de colegio.
  if (!cycle.schoolDay) {
    const sig = siguienteDia
    const primera = sig ? classesOnly(resolveDay(setup, sig.cycleDay, sig.date))[0] : undefined
    return (
      <section aria-label="Colegio" className="flex flex-col gap-1 rounded-[22px] bg-hero-to p-4 text-hero-fg lg:p-6">
        <p className="text-micro uppercase text-brand">{etiqueta}</p>
        {sig ? (
          <>
            <p className="text-xl font-semibold leading-7">
              El {fechaCorta(sig.date)} te toca Día {sig.cycleDay}
            </p>
            <p className="text-caption text-hero-fg/70">
              {primera ? `Entras a las ${hora12(primera.start)} con ${primera.cls.name}` : `${sig.classes.length} clases`}
            </p>
            {onIrA && (
              <button
                type="button"
                onClick={() => onIrA(sig.date)}
                className="mt-3 h-11 self-start rounded-full bg-brand px-4 text-body font-semibold text-brand-on"
              >
                Ver ese día
              </button>
            )}
          </>
        ) : (
          <p className="text-xl font-semibold">No hay clases a la vista.</p>
        )}
      </section>
    )
  }

  return (
    <section
      aria-label="Colegio"
      className="flex flex-col gap-3.5 rounded-[22px] bg-hero-to p-4 text-hero-fg lg:flex-row lg:items-center lg:gap-7 lg:px-6 lg:py-5"
    >
      <p className="text-micro uppercase text-brand lg:hidden">{etiqueta}</p>
      <div className="-mt-1.5 flex items-end justify-between gap-3 lg:contents">
        <div className="min-w-0">
          <p className="hidden text-micro uppercase text-brand lg:block">{etiqueta}</p>
          <p className="text-[26px] font-semibold leading-8 tracking-tight lg:text-display">Día {cycle.cycleDay}</p>
          <p className="text-caption text-hero-fg/70">
            {classes.length} clases{salida ? ` · sales a las ${salida}` : ''}
          </p>
        </div>
        {bloque1 && (
          <>
            <span aria-hidden className="hidden w-px self-stretch bg-hero-fg/15 lg:block" />
            <div className="min-w-0 text-right lg:text-left">
              <p className="text-xs font-semibold text-hero-fg/70">{bloque1.titulo}</p>
              <p className="truncate text-base font-semibold leading-[22px] lg:text-lg">{bloque1.clase.cls.name}</p>
              <p className="text-caption text-hero-fg/70">{bloque1.meta}</p>
            </div>
          </>
        )}
        {bloque2 && (
          <>
            <span aria-hidden className="hidden w-px self-stretch bg-hero-fg/15 lg:block" />
            <div className="hidden min-w-0 lg:block">
              <p className="text-xs font-semibold text-hero-fg/70">{bloque2.titulo}</p>
              <p className="truncate text-lg font-semibold leading-[22px]">{bloque2.clase.cls.name}</p>
              <p className="text-caption text-hero-fg/70">{bloque2.meta}</p>
            </div>
          </>
        )}
      </div>

      <span className="hidden flex-1 lg:block" />
      {enVivo && classes.length > 0 && (
        <Anillo hechas={terminadas} total={classes.length} />
      )}

      {onVerHorario && (
        <button
          type="button"
          onClick={onVerHorario}
          className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-brand text-body font-semibold text-brand-on transition-transform active:scale-[0.98] lg:hidden"
        >
          {etiquetaBoton ?? 'Ver horario'}
          <ChevronUp size={16} strokeWidth={2.4} aria-hidden />
        </button>
      )}
    </section>
  )
}

/** Anillo de clases hechas, solo en el computador. */
function Anillo({ hechas, total }: { hechas: number; total: number }) {
  const r = 32
  const c = 2 * Math.PI * r
  const largo = total > 0 ? (hechas / total) * c : 0
  return (
    <div className={cx('relative hidden h-[76px] w-[76px] shrink-0 lg:block')}>
      <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${hechas} de ${total} clases hechas`}>
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-hero-fg/15" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${largo} ${c}`}
          transform="rotate(-90 38 38)"
          className="stroke-brand"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-semibold leading-5">
          {hechas}/{total}
        </span>
        <span className="text-xs text-hero-fg/70">clases</span>
      </div>
    </div>
  )
}
