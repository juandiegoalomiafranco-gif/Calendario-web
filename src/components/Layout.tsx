import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-full bg-ink-50">
      <main className="mx-auto max-w-md px-4 pt-6 pb-28">{children}</main>
      <BottomNav />
    </div>
  )
}
