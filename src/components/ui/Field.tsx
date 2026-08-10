import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

const CONTROL =
  'w-full rounded-2xl border border-line bg-surface-2 px-3 py-2.5 text-content ' +
  'placeholder:text-content-subtle transition-colors focus:border-brand focus:bg-surface'

interface FieldProps {
  label: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}

/** Etiqueta + control + pista, el envoltorio de todos los formularios. */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-content-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-content-subtle leading-snug">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, 'text-base', className)} {...rest} />
}

export function NumberInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={cx(CONTROL, 'text-base font-semibold tabular', className)}
      {...rest}
    />
  )
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'text-sm resize-y', className)} {...rest} />
}
