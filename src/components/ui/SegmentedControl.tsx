import { cx } from '../../lib/cx'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
  /** `pill` imita las pastillas sueltas de la referencia; `inset` va sobre un carril gris. */
  variant?: 'pill' | 'inset'
}

/**
 * Selector de pestañas. En `pill` las opciones flotan sueltas y la activa se rellena
 * de grafito, como la barra superior de la referencia.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  variant = 'inset',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        // `max-w-full` + scroll propio: en móvil las pestañas se deslizan
        // en vez de empujar la página y provocar scroll horizontal.
        'inline-flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar',
        variant === 'inset' && 'rounded-full bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cx(
              'h-8 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150',
              selected
                ? 'bg-primary text-primary-on'
                : variant === 'pill'
                  ? 'border border-line bg-surface text-content-muted hover:text-content'
                  : 'text-content-muted hover:text-content',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
