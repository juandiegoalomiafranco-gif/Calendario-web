import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `plain` quita el relleno para tarjetas que gestionan su propio interior. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 sm:p-6',
} as const

/** Superficie base de la app: fondo, borde sutil y sombra según el tema. */
export function Card({ padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-3xl bg-surface border border-line shadow-card',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

interface SectionProps {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Bloque con encabezado y contenido, el patrón que repiten Progreso y Ajustes. */
export function Section({ title, action, className, children }: SectionProps) {
  return (
    <section className={cx('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-content">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
