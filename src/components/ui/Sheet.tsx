import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../../lib/cx'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { SCROLL_AREA_ID } from '../ScrollToTop'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  /** Texto pequeño bajo el título (fecha, materia…). */
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Diálogo para crear y editar: hoja inferior en móvil, ventana centrada en escritorio.
 * Se cierra con Escape o tocando fuera.
 *
 * La hoja se apoya en el borde de lo que se VE (`useKeyboardInset`), no en el borde de
 * la pantalla. Sin eso, en el celular el teclado se abre encima del pie y el botón de
 * guardar queda debajo, imposible de tocar.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, className }: SheetProps) {
  const teclado = useKeyboardInset()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Evita que el fondo se desplace mientras la hoja está abierta. El scroll vive en
    // el contenedor del armazón, no en `body`: bloquear `body` aquí no haría nada.
    const fondo = document.getElementById(SCROLL_AREA_ID)
    const previo = fondo?.style.overflow ?? ''
    if (fondo) fondo.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      if (fondo) fondo.style.overflow = previo
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={teclado ? { paddingBottom: teclado } : undefined}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-content/25 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // Con el teclado arriba, el hueco disponible ya es el del padre: `100%` lo
        // aprovecha entero en vez de medirse contra la pantalla completa.
        style={teclado ? { maxHeight: '100%' } : undefined}
        className={cx(
          'sheet-panel scroll-slim relative flex w-full flex-col overflow-y-auto border border-line bg-surface shadow-lg',
          'rounded-t-4xl sm:max-w-lg sm:rounded-3xl',
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-content">{title}</h2>
            {subtitle && <p className="truncate text-sm text-content-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            <X size={17} aria-hidden />
          </button>
        </div>

        <div
          className={cx(
            'flex flex-col gap-4 px-5 py-5',
            // Sin pie, es el contenido el que no debe quedar bajo el indicador de inicio.
            !footer && 'pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5',
          )}
        >
          {children}
        </div>

        {footer && (
          // La zona segura va AQUÍ y no en el contenedor con scroll: un `sticky
          // bottom-0` se pega al borde de la caja que hace scroll, así que el relleno
          // de fuera no lo levantaba y el botón caía sobre el indicador de inicio.
          // Fondo opaco: con `/95` se transparentaba la píldora de la barra de abajo
          // y parecía que la barra estaba tapando el botón.
          <div className="sticky bottom-0 border-t border-line bg-surface px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
