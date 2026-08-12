import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cx } from '../../lib/cx'

const CONTROL =
  'w-full rounded-2xl border border-line bg-surface-2 px-3 py-2.5 text-content ' +
  'placeholder:text-content-subtle transition-colors focus:border-primary focus:bg-surface'

interface FieldProps {
  label: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}

/** Etiqueta + control + pista: el envoltorio de todos los formularios. */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-xs font-semibold text-content-muted">{label}</span>
      {children}
      {hint && <span className="text-xs leading-snug text-content-subtle">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, 'text-[15px]', className)} {...rest} />
}

export function NumberInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={cx(CONTROL, 'tabular text-[15px] font-semibold', className)}
      {...rest}
    />
  )
}

export function DateInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" className={cx(CONTROL, 'text-[15px]', className)} {...rest} />
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'resize-y text-sm', className)} {...rest} />
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(CONTROL, 'text-[15px]', className)} {...rest} />
}
