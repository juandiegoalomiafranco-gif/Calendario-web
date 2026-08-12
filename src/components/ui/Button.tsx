import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-primary-on hover:bg-primary-hover shadow-sm',
  secondary: 'bg-surface-2 text-content hover:bg-surface-3',
  ghost: 'text-content-muted hover:bg-surface-2 hover:text-content',
  outline: 'border border-line bg-surface text-content hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  icon: 'h-10 w-10 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center rounded-full font-semibold transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  )
}
