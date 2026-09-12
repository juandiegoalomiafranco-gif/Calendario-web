import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
  /** Oculta el nav inferior (login y configuración inicial lo ocupan todo). */
  hideNav?: boolean
}

export function Layout({ children, hideNav }: LayoutProps) {
  return (
    <div className="app-shell bg-ink-50">
      <main
        className={`mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)] ${
          hideNav ? 'pb-10' : 'pb-28'
        }`}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
