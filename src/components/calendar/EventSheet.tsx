import { useEffect, useState } from 'react'
import { Bookmark, CalendarDays, ExternalLink, Mail, Trash2 } from 'lucide-react'
import {
  EVENT_TYPE_META,
  EVENT_TYPE_ORDER,
  useCalendarEvents,
  type CalendarEvent,
  type EventType,
} from '../../hooks/useCalendarEvents'
import { formatFull } from '../../lib/dates'
import { enlaceCorreo } from '../../lib/eventos'
import { useGoogle } from '../../hooks/useGoogle'
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
  const { conectado } = useGoogle()
  const isEdit = event != null

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('personal')
  const [when, setWhen] = useState(date)
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [important, setImportant] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setType(event?.type ?? 'personal')
    setWhen(event?.date ?? date)
    setTime(event?.time ?? '')
    setEndTime(event?.endTime ?? '')
    setLocation(event?.location ?? '')
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
      // Sin hora de inicio una hora de fin no significa nada.
      endTime: time && endTime ? endTime : undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      // Si se movió el inicio más allá del último día, el evento vuelve a ser de un día.
      endDate: event?.endDate && event.endDate > when ? event.endDate : undefined,
    }
    // Se parte del evento original para no perder de dónde viene (source) ni sus enlaces.
    if (isEdit && event) updateEvent({ ...event, ...payload })
    else addEvent(payload)
    onClose()
  }

  const enlaceGoogle = event?.googleLink
  const enlaceMail = event ? enlaceCorreo(event) : undefined
  // Borrarlo aquí lo borra también en Google Calendar si el evento está (o va a estar) allí.
  const avisoBorrado =
    isEdit &&
    event?.source !== 'colegio' &&
    (event?.source === 'google' || event?.source === 'gmail' || conectado)

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Termina (opcional)">
          <TextInput
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!time}
          />
        </Field>
        <Field label="Lugar (opcional)">
          <TextInput
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Consultorio, casa de…"
          />
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

      {(enlaceGoogle || enlaceMail) && (
        <div className="flex flex-wrap gap-2">
          {enlaceGoogle && (
            <a
              href={enlaceGoogle}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-2"
            >
              <CalendarDays size={15} aria-hidden />
              Abrir en Google Calendar
              <ExternalLink size={13} className="text-content-subtle" aria-hidden />
            </a>
          )}
          {enlaceMail && (
            <a
              href={enlaceMail}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-2"
            >
              <Mail size={15} aria-hidden />
              Abrir correo
              <ExternalLink size={13} className="text-content-subtle" aria-hidden />
            </a>
          )}
        </div>
      )}

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

      {avisoBorrado && (
        <p className="text-xs leading-relaxed text-content-subtle">
          {event?.source === 'gmail'
            ? 'Lo agregó Claude desde un correo. Si lo borras, también se borra de Google Calendar.'
            : 'Si lo borras, también se borra de Google Calendar.'}
        </p>
      )}
    </Sheet>
  )
}
