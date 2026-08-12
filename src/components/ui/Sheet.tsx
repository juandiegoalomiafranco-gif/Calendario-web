import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../../lib/cx'

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
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Evita que el fondo se desplace mientras la hoja está abierta
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
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
        className={cx(
          'scroll-slim relative flex max-h-[88vh] w-full flex-col overflow-y-auto border border-line bg-surface shadow-lg',
          'rounded-t-4xl pb-[env(safe-area-inset-bottom)] sm:max-w-lg sm:rounded-3xl sm:pb-0',
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

        <div className="flex flex-col gap-4 px-5 py-5">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
