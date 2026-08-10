import { Link } from 'react-router-dom'

/** Antes, una URL desconocida dejaba la pantalla en negro con solo el nav flotando. */
export function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-start">
      <p className="text-5xl" aria-hidden>
        🧭
      </p>
      <h1 className="text-2xl font-bold text-ink-900">Esta página no existe</h1>
      <p className="text-sm text-ink-500">
        El enlace que abriste no lleva a ninguna parte de la app. Puede ser un enlace viejo o mal escrito.
      </p>
      <Link to="/" className="min-h-[44px] px-5 inline-flex items-center rounded-full bg-brand-500 text-white font-semibold">
        Ir a Hoy
      </Link>
    </div>
  )
}
