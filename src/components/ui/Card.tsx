import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING
  children: ReactNode
}

/** Superficie base de MyLife: tarjeta blanca, borde sutil y sombra difusa. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        'rounded-3xl border border-line bg-surface shadow-card',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})

interface CardHeaderProps {
  title: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

/** Encabezado interno de tarjeta: título pequeño a la izquierda, acción a la derecha. */
export function CardHeader({ title, action, icon, className }: CardHeaderProps) {
  return (
    <div className={cx('mb-3 flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h2 className="truncate text-[15px] font-semibold tracking-tight text-content">{title}</h2>
      </div>
      {action}
    </div>
  )
}

interface SectionProps {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Bloque de página con encabezado y contenido. */
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
