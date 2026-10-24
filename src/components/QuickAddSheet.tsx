import { useState } from 'react'
import { BookOpen, CalendarPlus, ClipboardCheck, GraduationCap, House, type LucideIcon } from 'lucide-react'
import type { TaskKind } from '../data/schoolTypes'
import { todayIso } from '../lib/dates'
import { AddItemSheet } from './school/AddItemSheet'
import { EventSheet } from './calendar/EventSheet'
import { Sheet } from './ui/Sheet'

type Opcion = 'tarea' | 'examen' | 'entrega' | 'personal' | 'evento'

const OPCIONES: { id: Opcion; label: string; hint: string; Icon: LucideIcon; tone: string }[] = [
  { id: 'tarea', label: 'Tarea', hint: 'De una materia', Icon: ClipboardCheck, tone: 'bg-cat-soft-blue text-cat-blue' },
  { id: 'examen', label: 'Examen', hint: 'O un quiz', Icon: GraduationCap, tone: 'bg-cat-soft-rose text-cat-rose' },
  { id: 'entrega', label: 'Entrega', hint: 'Trabajo o proyecto', Icon: BookOpen, tone: 'bg-cat-soft-teal text-cat-teal' },
  { id: 'evento', label: 'Evento', hint: 'Al calendario', Icon: CalendarPlus, tone: 'bg-cat-soft-violet text-cat-violet' },
  { id: 'personal', label: 'Pendiente personal', hint: 'Casa, trámites…', Icon: House, tone: 'bg-cat-soft-amber text-cat-amber' },
]

/**
 * Lo que abre el «+» de la barra: elegir qué añadir y saltar directo a su formulario.
 * Reutiliza los formularios que ya existen, así lo creado aquí es idéntico a lo que se
 * crea desde Colegio, Pendientes o el Calendario.
 */
export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [elegida, setElegida] = useState<Opcion | null>(null)
  const hoy = todayIso()

  function elegir(o: Opcion) {
    onClose()
    setElegida(o)
  }

  const esTareaColegio = elegida === 'tarea' || elegida === 'examen' || elegida === 'entrega'

  return (
    <>
      <Sheet open={open} onClose={onClose} title="¿Qué quieres añadir?">
        <div className="grid grid-cols-2 gap-2.5">
          {OPCIONES.map(({ id, label, hint, Icon, tone }) => (
            <button
              key={id}
              type="button"
              onClick={() => elegir(id)}
              className={`flex min-h-[72px] items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2 ${id === 'personal' ? 'col-span-2' : ''}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon size={19} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold text-content">{label}</span>
                <span className="block text-caption text-content-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <AddItemSheet
        open={esTareaColegio || elegida === 'personal'}
        onClose={() => setElegida(null)}
        initialKind={esTareaColegio ? (elegida as TaskKind) : 'tarea'}
        initialScope={elegida === 'personal' ? 'personal' : 'colegio'}
        lockScope
      />
      <EventSheet open={elegida === 'evento'} onClose={() => setElegida(null)} date={hoy} />
    </>
  )
}
