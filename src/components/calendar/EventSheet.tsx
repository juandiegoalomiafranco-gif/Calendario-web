import { useEffect, useState } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import {
  EVENT_TYPE_META,
  EVENT_TYPE_ORDER,
  useCalendarEvents,
  type CalendarEvent,
  type EventType,
} from '../../hooks/useCalendarEvents'
import { formatFull } from '../../lib/dates'
import { cx } from '../../lib/cx'
import { Button } from '../ui/Button'
import { DateInput, Field, TextArea, TextInput } from '../ui/Field'
import { Sheet } from '../ui/Sheet'

interface EventSheetProps {
  open: boolean
  onClose: () => void
  /** Fecha propuesta al crear. */
  date: string
  /** Si viene, se edita ese evento en vez de crear uno nuevo. */
  event?: CalendarEvent | null
}

/**
 * Crear o editar un evento. Aquí está el marcador de «importante»: lo destaca en la
 * rejilla del calendario y lo sube a la tarjeta de eventos importantes del inicio.
 */
export function EventSheet({ open, onClose, date, event }: EventSheetProps) {
  const { addEvent, updateEvent, removeEvent } = useCalendarEvents()
  const isEdit = event != null

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('personal')
  const [when, setWhen] = useState(date)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [important, setImportant] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setType(event?.type ?? 'personal')
    setWhen(event?.date ?? date)
    setTime(event?.time ?? '')
    setNotes(event?.notes ?? '')
    setImportant(event?.important ?? false)
  }, [open, event, date])

  function save() {
    const clean = title.trim()
    if (!clean) return
    const payload = {
      date: when,
      title: clean,
      type,
      important,
      time: time || undefined,
      notes: notes.trim() || undefined,
    }
    if (isEdit && event) updateEvent({ ...payload, id: event.id })
    else addEvent(payload)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar evento' : 'Nuevo evento'}
      subtitle={formatFull(when)}
      footer={
        <div className="flex gap-2">
          {isEdit && event && (
            <Button
              variant="danger"
              size="lg"
              onClick={() => {
                removeEvent(event.id)
                onClose()
              }}
            >
              <Trash2 size={16} aria-hidden />
              Borrar
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={save}>
            Guardar
          </Button>
        </div>
      }
    >
      <Field label="¿Qué es?">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cita con el ortodoncista"
          autoFocus
        />
      </Field>

      <Field label="Tipo de evento">
        <div className="grid grid-cols-3 gap-1.5">
          {EVENT_TYPE_ORDER.map((t) => {
            const meta = EVENT_TYPE_META[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={cx(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition-colors',
                  type === t ? meta.color.solid : 'bg-surface-2 text-content-muted hover:text-content',
                )}
              >
                <meta.Icon size={17} aria-hidden />
                {meta.label}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Fecha">
          <DateInput value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Hora (opcional)">
          <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Notas (opcional)">
        <TextArea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dirección, qué llevar…"
        />
      </Field>

      {/* El marcador que pediste: deja el evento señalado en el calendario */}
      <button
        type="button"
        onClick={() => setImportant((v) => !v)}
        aria-pressed={important}
        className={cx(
          'flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition-colors',
          important
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-line bg-surface-2 text-content-muted hover:text-content',
        )}
      >
        <Bookmark
          size={18}
          strokeWidth={2.2}
          className={cx(important && 'fill-current')}
          aria-hidden
        />
        <span className="min-w-0">
          <span className="block text-sm font-bold">Marcar como importante</span>
          <span className="block text-xs opacity-80">
            Se destaca en el calendario y aparece en el inicio.
          </span>
        </span>
      </button>
    </Sheet>
  )
}
