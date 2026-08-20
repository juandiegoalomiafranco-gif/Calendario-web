import { useEffect, useRef } from 'react'
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Underline,
  type LucideIcon,
} from 'lucide-react'
import { noteHtml, sanitizeHtml } from '../../lib/richText'
import { cx } from '../../lib/cx'

interface Tool {
  label: string
  Icon: LucideIcon
  command: string
  value?: string
}

/** Lo que pidió para las notas: viñetas, números, subrayar y títulos. */
const TOOLS: (Tool | 'sep')[] = [
  { label: 'Negrita', Icon: Bold, command: 'bold' },
  { label: 'Cursiva', Icon: Italic, command: 'italic' },
  { label: 'Subrayado', Icon: Underline, command: 'underline' },
  // 'mark' no es un comando de execCommand: lo resolvemos aparte en `run`.
  { label: 'Resaltar', Icon: Highlighter, command: 'mark' },
  'sep',
  { label: 'Título', Icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: 'Subtítulo', Icon: Heading3, command: 'formatBlock', value: 'h3' },
  'sep',
  { label: 'Viñetas', Icon: List, command: 'insertUnorderedList' },
  { label: 'Lista numerada', Icon: ListOrdered, command: 'insertOrderedList' },
  'sep',
  { label: 'Quitar formato', Icon: Eraser, command: 'removeFormat' },
]

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface RichTextProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Alto mínimo del área de escritura. */
  minHeight?: string
  ariaLabel?: string
}

/**
 * Editor de texto con formato para las notas de clase. Es un documento, no una
 * notita: se escribe seguido y se le da forma con la barra de arriba.
 *
 * Usa `document.execCommand`, que está marcado como obsoleto pero sigue siendo lo
 * único que funciona igual en todos los navegadores sin traerse una librería de
 * cientos de kilobytes a una app que se abre desde el celular. Lo que se guarda pasa
 * siempre por `sanitizeHtml`, así que pegar desde Word o desde una página web no
 * mete estilos ni scripts.
 */
export function RichText({
  value,
  onChange,
  placeholder,
  minHeight = '18rem',
  ariaLabel = 'Contenido de la nota',
}: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Solo se escribe en el DOM cuando el valor viene de fuera: hacerlo en cada
  // pulsación movería el cursor al principio en cada letra.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const next = noteHtml(value)
    if (el.innerHTML !== next && document.activeElement !== el) el.innerHTML = next
  }, [value])

  function run(tool: Tool) {
    ref.current?.focus()
    if (tool.command === 'mark') {
      // `hiliteColor` deja un <span style="background:…"> que el saneado descarta,
      // así que el resaltado se envuelve a mano en <mark> y el color lo pone el tema.
      const sel = window.getSelection()
      const text = sel?.toString()
      if (text) document.execCommand('insertHTML', false, `<mark>${escapeHtml(text)}</mark>`)
    } else {
      document.execCommand(tool.command, false, tool.value)
    }
    emit()
  }

  function emit() {
    if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2 focus-within:border-primary">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface px-1.5 py-1.5">
        {TOOLS.map((t, i) =>
          t === 'sep' ? (
            <span key={`sep-${i}`} className="mx-1 h-5 w-px bg-line" aria-hidden />
          ) : (
            <button
              key={t.label}
              type="button"
              // onMouseDown en vez de onClick: si el botón toma el foco primero,
              // se pierde la selección de texto y el comando no se aplica a nada.
              onMouseDown={(e) => {
                e.preventDefault()
                run(t)
              }}
              title={t.label}
              aria-label={t.label}
              className="grid h-8 w-8 place-items-center rounded-lg text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              <t.Icon size={16} aria-hidden />
            </button>
          ),
        )}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Pegar siempre en limpio: el HTML de Word o Docs trae media hoja de estilos.
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
        }}
        className={cx(
          'prose-nota w-full overflow-y-auto px-4 py-3 text-[15px] leading-relaxed text-content',
          'focus:outline-none',
        )}
        style={{ minHeight }}
      />
    </div>
  )
}

/** Nota ya guardada, pintada en modo lectura con los mismos estilos. */
export function RichTextView({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cx('prose-nota text-[15px] leading-relaxed text-content', className)}
      dangerouslySetInnerHTML={{ __html: noteHtml(html) }}
    />
  )
}
