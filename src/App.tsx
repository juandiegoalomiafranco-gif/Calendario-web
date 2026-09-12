import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { useAuth } from './hooks/useAuth'
import { useAccounts } from './hooks/useStores'
import { Ajustes } from './pages/Ajustes'
import { Login } from './pages/Login'
import { Metas } from './pages/Metas'
import { MovimientoForm } from './pages/MovimientoForm'
import { Movimientos } from './pages/Movimientos'
import { Onboarding } from './pages/Onboarding'
import { Presupuesto } from './pages/Presupuesto'
import { Resumen } from './pages/Resumen'

/** Pantallas que se muestran a pantalla completa, sin el nav inferior. */
const FULL_SCREEN = ['/entrar', '/bienvenida']

function AuthedRoutes() {
  const accounts = useAccounts()
  const { pathname } = useLocation()

  // Sin cuentas, lo primero es registrarlas: cualquier otra pantalla estaría vacía.
  if (accounts.length === 0 && pathname !== '/bienvenida' && pathname !== '/ajustes') {
    return <Navigate to="/bienvenida" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<Resumen />} />
      <Route path="/bienvenida" element={<Onboarding />} />
      <Route path="/movimientos" element={<Movimientos />} />
      <Route path="/movimientos/:id" element={<MovimientoForm />} />
      <Route path="/presupuesto" element={<Presupuesto />} />
      <Route path="/metas" element={<Metas />} />
      <Route path="/ajustes" element={<Ajustes />} />
      <Route path="/entrar" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { session, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) {
    return (
      <Layout hideNav>
        <div className="flex items-center justify-center pt-24" role="status" aria-live="polite">
          <p className="text-sm text-ink-500">Cargando…</p>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout hideNav>
        <ScrollToTop />
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="*" element={<Navigate to="/entrar" replace />} />
        </Routes>
      </Layout>
    )
  }

  return (
    <Layout hideNav={FULL_SCREEN.includes(pathname)}>
      <ScrollToTop />
      <AuthedRoutes />
    </Layout>
  )
}
