import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { Today } from './pages/Today'
import { Week } from './pages/Week'
import { DayDetail } from './pages/DayDetail'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { useAuth } from './hooks/useAuth'

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell bg-ink-50">
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-10">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <AuthShell>
        <div className="min-h-[75vh] flex items-center justify-center">
          <p className="text-sm text-ink-500">Cargando…</p>
        </div>
      </AuthShell>
    )
  }

  if (!session) {
    return (
      <AuthShell>
        <Login />
      </AuthShell>
    )
  }

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/semana" element={<Week />} />
        <Route path="/dia/:date" element={<DayDetail />} />
        <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
        <Route path="/progreso" element={<Progress />} />
        <Route path="/ajustes" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
