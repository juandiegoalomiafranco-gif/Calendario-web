import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, dayNumber, formatFull, WEEKDAY_INITIAL, WEEKDAY_LONG, weekDays } from '../../lib/dates'
import { cx } from '../../lib/cx'

interface WeekStripProps {
  /** Día elegido (`YYYY-MM-DD`). La tira muestra su semana, de lunes a domingo. */
  selected: string
  today: string
  onSelect: (iso: string) => void
  /** Días con algo (pendientes o eventos): llevan un punto. */
  ocupado?: (iso: string) => boolean
  /** Días sin colegio: se pintan apagados. */
  sinClase?: (iso: string) => boolean
  /** Texto bajo el número en escritorio («Día 4», «Descanso»). */
  etiqueta?: (iso: string) => string
}

/**
 * La tira de días de la semana, como en la referencia: el día elegido en una píldora
 * lima y el de hoy con un aro. En el celular se pasa de semana deslizando; en el
 * computador, con las flechas.
 */
export function WeekStrip({ selected, today, onSelect, ocupado, sinClase, etiqueta }: WeekStripProps) {
  const dias = weekDays(selected)
  const inicioToque = useRef<number | null>(null)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(addDays(selected, -7))}
        aria-label="Semana anterior"
        className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-content-muted transition-colors hover:text-content lg:grid"
      >
        <ChevronLeft size={18} aria-hidden />
      </button>

      <div
        role="group"
        aria-label="Días de la semana"
        className="grid flex-1 grid-cols-7 gap-1 lg:gap-2.5"
        onTouchStart={(e) => {
          inicioToque.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          const x0 = inicioToque.current
          inicioToque.current = null
          const x1 = e.changedTouches[0]?.clientX
          if (x0 == null || x1 == null) return
          // Un deslizamiento claro cambia de semana; un toque corto sigue siendo un toque.
          if (Math.abs(x1 - x0) > 50) onSelect(addDays(selected, x1 < x0 ? 7 : -7))
        }}
      >
        {dias.map((d, i) => {
          const esElegido = d === selected
          const esHoy = d === today
          const apagado = sinClase?.(d) ?? false
          const punto = ocupado?.(d) ?? false
          const sub = etiqueta?.(d)
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={esElegido}
              aria-label={`${formatFull(d)}${esHoy ? ', hoy' : ''}`}
              className={cx(
                'flex h-[76px] flex-col items-center justify-center gap-1 rounded-full transition-colors lg:h-[84px] lg:rounded-[22px] lg:border',
                esElegido
                  ? 'bg-brand text-brand-on lg:border-brand'
                  : cx(
                      'lg:bg-surface',
                      apagado ? 'text-content-subtle' : 'text-content',
                      esHoy ? 'ring-[1.5px] ring-inset ring-content lg:border-content' : 'lg:border-line',
                    ),
              )}
            >
              <span className="text-micro opacity-80 lg:hidden">{WEEKDAY_INITIAL[i]}</span>
              <span className="hidden text-caption font-semibold capitalize opacity-75 lg:block">
                {WEEKDAY_LONG[i]}
              </span>
              <span className="text-lg font-semibold leading-[22px] lg:text-[22px] lg:leading-[26px]">
                {dayNumber(d)}
              </span>
              <span
                aria-hidden
                className={cx(
                  'h-[5px] w-[5px] rounded-full lg:hidden',
                  punto ? (esElegido ? 'bg-brand-on' : 'bg-cat-rose') : 'bg-transparent',
                )}
              />
              {sub && (
                <span
                  className={cx(
                    'hidden text-xs font-semibold lg:block',
                    esElegido ? 'text-brand-on' : punto ? 'text-cat-rose' : 'text-content-muted',
                  )}
                >
                  {sub}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onSelect(addDays(selected, 7))}
        aria-label="Semana siguiente"
        className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-content-muted transition-colors hover:text-content lg:grid"
      >
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  )
}
