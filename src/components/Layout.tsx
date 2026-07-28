import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell bg-ink-50">
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-28">
        {/* key por ruta: re-monta y reproduce la animación de entrada en cada navegación.
            Con prefers-reduced-motion la animación dura ~0 (ver styles/index.css). */}
        <div key={pathname} className="app-page-enter">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
