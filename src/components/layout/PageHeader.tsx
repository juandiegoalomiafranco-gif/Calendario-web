import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface PageHeaderProps {
  /** Línea pequeña sobre el título: texto o un enlace de vuelta. */
  eyebrow?: ReactNode
  title: string
  /**
   * Frase que explica la pantalla. Va pegada al título — también en móvil, donde
   * las acciones se colocan debajo y separarían el texto de su encabezado.
   */
  description?: ReactNode
  /** Controles a la derecha: pestañas, buscador, botón de añadir. */
  actions?: ReactNode
  /** Contenido extra debajo de todo (chips, avisos). */
  children?: ReactNode
  className?: string
}

/** Cabecera de página: subtítulo pequeño encima, título grande y acciones al lado. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cx('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-sm font-medium text-content-muted first-letter:uppercase">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-content lg:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-content-muted">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  )
}
