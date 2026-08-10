import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'icon' | 'icon-sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-brand-on hover:bg-brand-strong shadow-sm',
  secondary: 'bg-surface-2 text-content hover:bg-surface-3',
  ghost: 'text-content-muted hover:bg-surface-2 hover:text-content',
  outline: 'border border-line bg-surface text-content hover:bg-surface-2',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  icon: 'h-10 w-10 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center rounded-full font-medium transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  )
}
