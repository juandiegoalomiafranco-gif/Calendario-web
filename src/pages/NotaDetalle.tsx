import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookMarked, Check, Plus, Star, Trash2 } from 'lucide-react'
import { colorOf } from '../data/palette'
import { useClassNote, useClassNotes, useSchoolSetup } from '../hooks/useSchool'
import { formatFull, todayIso } from '../lib/dates'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Select, TextInput } from '../components/ui/Field'
import { RichText } from '../components/ui/RichText'

/**
 * Una nota de clase a página completa: un documento, no una notita en un panel.
 * Se guarda sola mientras escribes, así que no hay forma de perder la clase por
 * cerrar sin darle a un botón.
 */
export function NotaDetalle() {
  const { code, id } = useParams()
  const classCode = code ? decodeURIComponent(code) : ''
  const navigate = useNavigate()

  const { setup, addUnit } = useSchoolSetup()
  const cls = setup.classes[classCode]
  const { addNote, updateNote, removeNote } = useClassNotes(classCode)
  const existente = useClassNote(id === 'nueva' ? undefined : id)

  const [noteId, setNoteId] = useState<string | undefined>(
    id === 'nueva' ? undefined : id,
  )
  const [unit, setUnit] = useState('')
  const [title, setTitle] = useState('')
  const [notebookPage, setNotebookPage] = useState('')
  const [body, setBody] = useState('')
  const [important, setImportant] = useState(false)
  const [nuevaUnidad, setNuevaUnidad] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<string | null>(null)

  // Carga inicial desde la nota existente. Solo una vez: después manda lo escrito.
  const [cargado, setCargado] = useState(false)
  useEffect(() => {
    if (cargado || !existente) return
    setUnit(existente.unit)
    setTitle(existente.title)
    setNotebookPage(existente.notebookPage)
    setBody(existente.body)
    setImportant(existente.important)
    setCargado(true)
  }, [existente, cargado])

  const units = useMemo(() => cls?.units ?? [], [cls])

  /** Guardado automático: crea la nota la primera vez y luego la va actualizando. */
  useEffect(() => {
    if (!cls) return
    if (!title.trim() && !body.trim()) return
    const t = setTimeout(() => {
      const datos = {
        classCode,
        date: existente?.date ?? todayIso(),
        unit,
        title,
        notebookPage,
        body,
        important,
      }
      if (noteId) {
        updateNote({ ...datos, id: noteId })
      } else {
        const creada = addNote(datos)
        setNoteId(creada.id)
      }
      setGuardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
    }, 700)
    return () => clearTimeout(t)
  }, [
    title,
    body,
    unit,
    notebookPage,
    important,
    noteId,
    classCode,
    cls,
    existente?.date,
    addNote,
    updateNote,
  ])

  if (!cls) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-content-muted">No encontramos esa materia.</p>
        <Link to="/colegio" className="inline-flex items-center gap-1.5 self-start font-semibold">
          <ArrowLeft size={16} aria-hidden /> Volver a Colegio
        </Link>
      </div>
    )
  }

  const color = colorOf(cls.color)

  function crearUnidad() {
    const clean = (nuevaUnidad ?? '').trim()
    if (!clean) return
    addUnit(classCode, clean)
    setUnit(clean)
    setNuevaUnidad(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 lg:gap-5">
      <PageHeader
        eyebrow={
          <Link
            to={`/colegio/clase/${encodeURIComponent(classCode)}`}
            className="inline-flex items-center gap-1 hover:text-content"
          >
            <ArrowLeft size={14} aria-hidden /> {cls.name}
          </Link>
        }
        title={title.trim() || 'Nota nueva'}
        actions={
          <>
            <span className="text-xs text-content-subtle">
              {guardado ? `Guardado ${guardado}` : 'Se guarda solo'}
            </span>
            <Button
              variant={important ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setImportant((v) => !v)}
              aria-pressed={important}
            >
              <Star size={14} className={cx(important && 'fill-current')} aria-hidden />
              Importante
            </Button>
            {noteId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  removeNote(noteId)
                  navigate(`/colegio/clase/${encodeURIComponent(classCode)}`)
                }}
              >
                <Trash2 size={14} aria-hidden />
                Eliminar
              </Button>
            )}
          </>
        }
      >
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <span className={cx('h-2.5 w-2.5 rounded-full', color.dot)} />
          {formatFull(existente?.date ?? todayIso())}
        </div>
      </PageHeader>

      <Card padding="lg" className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Unidad" hint="Agrupa y filtra las notas de la materia.">
            {nuevaUnidad !== null ? (
              <div className="flex gap-1.5">
                <TextInput
                  value={nuevaUnidad}
                  onChange={(e) => setNuevaUnidad(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && crearUnidad()}
                  placeholder="Unidad 3 — Derivadas"
                  autoFocus
                />
                <Button variant="primary" onClick={crearUnidad}>
                  <Check size={15} aria-hidden />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Sin unidad</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  {unit && !units.includes(unit) && <option value={unit}>{unit}</option>}
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNuevaUnidad('')}
                  aria-label="Crear unidad nueva"
                  title="Crear unidad nueva"
                >
                  <Plus size={16} aria-hidden />
                </Button>
              </div>
            )}
          </Field>

          <Field label="Página del cuaderno" className="sm:w-40">
            <TextInput
              value={notebookPage}
              onChange={(e) => setNotebookPage(e.target.value)}
              placeholder="42"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field label="Título">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Regla de la cadena"
            className="text-lg font-bold"
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-content-muted">Lo que vimos</span>
          <RichText
            value={body}
            onChange={setBody}
            placeholder="Escribe la clase. Usa la barra de arriba para viñetas, números, títulos y subrayado."
            minHeight="24rem"
          />
        </div>

        {notebookPage && (
          <p className="flex items-center gap-1.5 text-xs text-content-subtle">
            <BookMarked size={12} aria-hidden />
            Está en la página {notebookPage} del cuaderno.
          </p>
        )}
      </Card>
    </div>
  )
}
