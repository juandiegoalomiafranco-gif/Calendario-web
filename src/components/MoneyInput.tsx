import { useEffect, useState } from 'react'
import { formatAmountInput, parseAmountInput } from '../lib/format'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
  /** Tamaño grande para el monto principal de un formulario. */
  large?: boolean
}

/**
 * Campo de monto en pesos. Muestra los miles agrupados mientras escribes y acepta
 * puntos, comas, espacios y el símbolo `$` sin quejarse.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  autoFocus,
  id,
  large,
}: MoneyInputProps) {
  const [text, setText] = useState(() => formatAmountInput(value))

  // Si el valor cambia desde afuera (por ejemplo al cargar un movimiento existente),
  // se refleja aquí — pero sin pisar lo que el usuario está escribiendo.
  useEffect(() => {
    if (parseAmountInput(text) !== value) setText(formatAmountInput(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <span
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 ${
          large ? 'text-2xl' : 'text-base'
        }`}
        aria-hidden
      >
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const parsed = parseAmountInput(e.target.value)
          setText(parsed === 0 && e.target.value.trim() === '' ? '' : formatAmountInput(parsed))
          onChange(parsed)
        }}
        className={`w-full rounded-xl border border-ink-200 bg-ink-100 text-ink-900 font-semibold tabular-nums ${
          large ? 'pl-9 pr-3 py-3.5 text-2xl' : 'pl-8 pr-3 py-2.5 text-base'
        }`}
      />
    </div>
  )
}
