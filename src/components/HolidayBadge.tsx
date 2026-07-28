interface HolidayBadgeProps {
  /** Nombre del festivo; si se omite, muestra solo "Festivo" (versión compacta). */
  name?: string | null
}

// Chip de festivo reutilizable (antes duplicado en Hoy, Detalle de día y Semana).
// La bandera 🇨🇴 es decorativa; el texto "Festivo" lleva el significado.
export function HolidayBadge({ name }: HolidayBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-200">
      <span aria-hidden>🇨🇴</span> Festivo{name ? ` · ${name}` : ''}
    </span>
  )
}
