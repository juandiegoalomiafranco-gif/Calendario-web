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
}

/** Selector Día / Semana / Mes, el mismo patrón de los calendarios de escritorio. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx('inline-flex items-center gap-1 rounded-full bg-surface-2 p-1', className)}
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
              'h-8 rounded-full px-3.5 text-sm font-medium transition-colors duration-150',
              selected
                ? 'bg-surface text-content shadow-sm'
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
