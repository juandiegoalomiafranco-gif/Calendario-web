import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell bg-ink-50">
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-28">{children}</main>
      <BottomNav />
    </div>
  )
}
