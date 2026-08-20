import { useState } from 'react'
import { Backpack, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { ScenarioCode } from '../../data/nutrition'
import {
  FRANJA_META,
  LONCHERA,
  cantidadPara,
  franjasDelDia,
  type Franja,
} from '../../data/lonchera'
import { useSchoolDay } from '../../hooks/useSchoolDay'
import { dayTypeFor } from '../../lib/school'
import { cx } from '../../lib/cx'
import { Card, CardHeader } from '../ui/Card'

/**
 * Qué llevar hoy al colegio, con gramos. Escoge según el escenario de comida del día
 * (que sale del entreno) y según el tipo de día: el miércoles salen a la 1:00 pm y
 * solo hay un recreo, así que ese día se empaca una sola lonchera más completa.
 *
 * Cada franja trae varias opciones para no llevar lo mismo todos los días.
 */
export function LoncheraCard({ dateIso, escenario }: { dateIso: string; escenario: ScenarioCode }) {
  const { setup, cycle } = useSchoolDay(dateIso)
  const tipoDeDia = dayTypeFor(setup, dateIso)
  const franjas = franjasDelDia(tipoDeDia)
  const [elegida, setElegida] = useState<Record<string, number>>({})

  // En un día sin colegio no hay lonchera que empacar.
  if (!cycle.schoolDay) return null

  function rotar(franja: Franja, delta: number) {
    const total = LONCHERA[franja].length
    setElegida((prev) => ({
      ...prev,
      [franja]: (((prev[franja] ?? 0) + delta) % total + total) % total,
    }))
  }

  return (
    <Card className="md:col-span-2 xl:col-span-3">
      <CardHeader
        title="Qué llevar hoy al colegio"
        icon={<Backpack size={16} className="text-content-subtle" aria-hidden />}
        action={<span className="text-xs text-content-subtle">Escenario {escenario}</span>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {franjas.map((franja) => {
          const opciones = LONCHERA[franja]
          const idx = elegida[franja] ?? 0
          const op = opciones[idx]
          const meta = FRANJA_META[franja]

          return (
            <div key={franja} className="rounded-2xl border border-line p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-content">{meta.titulo}</p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-content-subtle">
                    <Clock size={10} aria-hidden />
                    {meta.hora}
                  </p>
                </div>
                <div className="inline-flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => rotar(franja, -1)}
                    aria-label="Opción anterior"
                    className="grid h-7 w-7 place-items-center rounded-full border border-line text-content-muted transition-colors hover:text-content"
                  >
                    <ChevronLeft size={14} aria-hidden />
                  </button>
                  <span className="tabular text-[11px] text-content-subtle">
                    {idx + 1}/{opciones.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => rotar(franja, 1)}
                    aria-label="Otra opción"
                    className="grid h-7 w-7 place-items-center rounded-full border border-line text-content-muted transition-colors hover:text-content"
                  >
                    <ChevronRight size={14} aria-hidden />
                  </button>
                </div>
              </div>

              <p className="mb-2 text-[15px] font-bold text-content">{op.nombre}</p>

              <ul className="flex flex-col">
                {op.items
                  // En algunos escenarios un ingrediente se quita del todo (E4 sin
                  // avena, por ejemplo). Listarlo con «0 g» solo confunde.
                  .filter((item) => !/^0\s/.test(cantidadPara(item.cantidad, escenario)))
                  .map((item) => (
                    <li
                      key={item.alimento}
                      className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-content">{item.alimento}</span>
                        {item.tip && (
                          <span className="block text-[11px] text-content-subtle">{item.tip}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular text-content-muted">
                        {cantidadPara(item.cantidad, escenario)}
                      </span>
                    </li>
                  ))}
              </ul>

              <p className={cx('mt-2 text-[11px] leading-relaxed text-content-subtle')}>
                {op.prep} · {meta.nota}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
