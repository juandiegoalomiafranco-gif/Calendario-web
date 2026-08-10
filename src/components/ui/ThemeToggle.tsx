import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../../hooks/useTheme'
import { cx } from '../../lib/cx'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
]

/** Claro / oscuro / sistema. `compact` deja sólo los iconos, para la barra lateral. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-full text-sm font-medium transition-colors',
              compact ? 'w-8 justify-center' : 'px-3',
              selected ? 'bg-surface text-content shadow-sm' : 'text-content-muted hover:text-content',
            )}
          >
            <Icon size={15} strokeWidth={2} aria-hidden />
            {!compact && label}
          </button>
        )
      })}
    </div>
  )
}
