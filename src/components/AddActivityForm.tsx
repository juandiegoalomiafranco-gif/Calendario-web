import { useState } from 'react'
import type { CustomKind, Slot } from '../data/types'
import { useCustomActivities } from '../hooks/useCustomActivities'

interface AddActivityFormProps {
  date: string
}

export function AddActivityForm({ date }: AddActivityFormProps) {
  const { add } = useCustomActivities()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<CustomKind>('futbol')
  const [slot, setSlot] = useState<Slot>('PM')
  const [note, setNote] = useState('')

  const reset = () => {
    setOpen(false)
    setKind('futbol')
    setSlot('PM')
    setNote('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-3xl border-2 border-dashed border-ink-200 text-ink-500 p-3 text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        + Añadir actividad
      </button>
    )
  }

  const chip = (active: boolean) =>
    `flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'
    }`

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-900">Añadir actividad</p>

      <div>
        <p className="text-xs text-ink-500 mb-1.5">Actividad</p>
        <div className="flex gap-2">
          <button className={chip(kind === 'futbol')} onClick={() => setKind('futbol')}>
            ⚽ Fútbol
          </button>
          <button className={chip(kind === 'voley')} onClick={() => setKind('voley')}>
            🏐 Vóley
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-500 mb-1.5">Horario</p>
        <div className="flex gap-2">
          <button className={chip(slot === 'AM')} onClick={() => setSlot('AM')}>
            Mañana
          </button>
          <button className={chip(slot === 'PM')} onClick={() => setSlot('PM')}>
            Tarde
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs text-ink-500">
        Nota (opcional)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: partido con el equipo del colegio"
          className="rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 text-sm text-ink-900"
        />
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            add({ date, kind, slot, note: note.trim() || undefined })
            reset()
          }}
          className="flex-1 rounded-full bg-brand-500 text-white text-sm font-semibold py-2.5 active:scale-[0.98] transition-transform"
        >
          Agregar
        </button>
        <button onClick={reset} className="flex-1 rounded-full bg-ink-100 text-ink-600 text-sm font-semibold py-2.5">
          Cancelar
        </button>
      </div>
    </div>
  )
}
