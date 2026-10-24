import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cx } from '../../lib/cx'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { QuickAddSheet } from '../QuickAddSheet'
import { MOBILE_ITEMS, type NavItem } from './navItems'

function Pestana({ to, label, Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        cx(
          'grid h-12 w-12 place-items-center rounded-full transition-colors',
          isActive ? 'bg-brand text-brand-on' : 'text-hero-fg/60 hover:text-hero-fg',
        )
      }
    >
      <Icon size={22} strokeWidth={1.9} aria-hidden />
    </NavLink>
  )
}

/**
 * Navegación de móvil: una píldora negra que flota sobre el contenido, solo iconos,
 * con el activo en un círculo lima y el «+» en el centro. En escritorio la sustituye
 * el rail de iconos.
 *
 * Flota con `position: absolute` dentro del armazón, NO con `fixed`. El armazón mide
 * exactamente la pantalla y el scroll vive en `#app-scroll`, así que la barra sigue
 * sin moverse con el rebote de iOS ni al abrirse el teclado; lo único que cambia es
 * que el contenido pasa por detrás y se aprovecha el hueco que antes quedaba abajo.
 *
 * Mientras el teclado está abierto se esconde: taparía el campo que se está llenando.
 */
export function BottomNav() {
  const teclado = useKeyboardInset()
  const [anadir, setAnadir] = useState(false)
  const [primeras, ultimas] = [MOBILE_ITEMS.slice(0, 2), MOBILE_ITEMS.slice(2)]

  return (
    <>
      <nav
        aria-label="Secciones"
        className={cx(
          'pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))] lg:hidden',
          teclado > 0 && 'hidden',
        )}
      >
        <div className="pointer-events-auto mx-auto flex h-[68px] w-[min(334px,calc(100%-2rem))] items-center justify-between rounded-full bg-hero-to px-2.5 shadow-lg">
          {primeras.map((item) => (
            <Pestana key={item.to} {...item} />
          ))}
          <button
            type="button"
            onClick={() => setAnadir(true)}
            aria-label="Añadir tarea, examen o evento"
            className="grid h-[52px] w-[52px] place-items-center rounded-full bg-hero-fg text-hero-to transition-transform active:scale-95"
          >
            <Plus size={22} strokeWidth={2.4} aria-hidden />
          </button>
          {ultimas.map((item) => (
            <Pestana key={item.to} {...item} />
          ))}
        </div>
      </nav>
      <QuickAddSheet open={anadir} onClose={() => setAnadir(false)} />
    </>
  )
}
