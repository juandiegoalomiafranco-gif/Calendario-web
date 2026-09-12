import { categoriesFor } from '../data/categories'
import type { TxType } from '../data/types'

interface CategoryPickerProps {
  type: TxType
  value: string
  onChange: (category: string) => void
}

/** Rejilla de categorías con objetivos de toque de 44px, como pide iOS. */
export function CategoryPicker({ type, value, onChange }: CategoryPickerProps) {
  const options = categoriesFor(type)

  return (
    <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-3 gap-1.5">
      {options.map((c) => {
        const selected = c.id === value
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(c.id)}
            className={`min-h-[56px] rounded-xl px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium leading-tight transition-colors ${
              selected
                ? 'bg-brand-500 text-white'
                : 'bg-ink-100 text-ink-700 border border-ink-200 active:bg-ink-200'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {c.emoji}
            </span>
            <span className="text-center">{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}
