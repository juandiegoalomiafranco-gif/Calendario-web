import { Check, X } from 'lucide-react'
import { ACTIVITIES, ACTIVITY_ORDER } from '../../data/activityMeta'
import { useActivityFilter } from '../../hooks/useActivityFilter'
import { cx } from '../../lib/cx'

/** "Mis actividades" de la barra lateral: casillas de color que filtran el calendario. */
export function ActivityFilterList() {
  const { isVisible, toggle } = useActivityFilter()

  return (
    <ul className="flex flex-col gap-0.5">
      {ACTIVITY_ORDER.map((key) => {
        const activity = ACTIVITIES[key]
        const visible = isVisible(key)
        return (
          <li key={key}>
            <button
              type="button"
              role="checkbox"
              aria-checked={visible}
              onClick={() => toggle(key)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <span
                className={cx(
                  'grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors',
                  visible ? cx(activity.dot, 'border-transparent') : 'border-line-strong',
                )}
              >
                {visible && <Check size={11} strokeWidth={3.5} className="text-white" aria-hidden />}
              </span>
              <span
                className={cx(
                  'truncate text-sm transition-colors',
                  visible ? 'text-content' : 'text-content-subtle',
                )}
              >
                {activity.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** Fila de chips de filtro para móvil: se desplaza en horizontal. */
export function ActivityFilterChips({ className }: { className?: string }) {
  const { isVisible, toggle } = useActivityFilter()

  return (
    <div
      className={cx('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]', className)}
    >
      {ACTIVITY_ORDER.map((key) => {
        const activity = ACTIVITIES[key]
        const visible = isVisible(key)
        return (
          <button
            key={key}
            type="button"
            aria-pressed={visible}
            onClick={() => toggle(key)}
            className={cx(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
              visible ? activity.soft : 'bg-surface-2 text-content-subtle',
            )}
          >
            <span
              className={cx('h-1.5 w-1.5 rounded-full', visible ? activity.dot : 'bg-line-strong')}
            />
            {activity.label}
            {visible && <X size={12} strokeWidth={2.5} aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
