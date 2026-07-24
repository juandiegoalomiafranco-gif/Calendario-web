interface PinPadProps {
  value: string
  onChange: (value: string) => void
  length?: number
  error?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Teclado numérico reutilizable con indicadores de puntos. Controlado por `value`. */
export function PinPad({ value, onChange, length = 4, error }: PinPadProps) {
  const push = (d: string) => {
    if (value.length < length) onChange(value + d)
  }
  const back = () => onChange(value.slice(0, -1))

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-colors ${
              error ? 'bg-brand-600' : i < value.length ? 'bg-ink-900' : 'bg-ink-200'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => push(d)}
            className="w-16 h-16 rounded-full bg-card shadow-card text-2xl font-semibold text-ink-900 active:scale-95 transition-transform"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => push('0')}
          className="w-16 h-16 rounded-full bg-card shadow-card text-2xl font-semibold text-ink-900 active:scale-95 transition-transform"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          aria-label="Borrar"
          className="w-16 h-16 rounded-full text-2xl text-ink-500 active:scale-95 transition-transform"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
