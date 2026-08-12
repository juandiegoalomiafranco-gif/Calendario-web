import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface ChipProps {
  children: ReactNode
  /** Punto de color a la izquierda, p. ej. `bg-cat-violet`. */
  dot?: string
  icon?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}

/** Etiqueta compacta: materia, urgencia, tipo de evento, dato suelto. */
export function Chip({ children, dot, icon, className, size = 'md' }: ChipProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        !className && 'bg-surface-2 text-content-muted',
        className,
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />}
      {icon}
      {children}
    </span>
  )
}
