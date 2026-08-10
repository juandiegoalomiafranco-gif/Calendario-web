import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { Today } from './pages/Today'
import { Calendar } from './pages/Calendar'
import { DayDetail } from './pages/DayDetail'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/calendario" element={<Calendar />} />
        {/* Ruta anterior: enlaces guardados y la pantalla de inicio del PWA siguen funcionando */}
        <Route path="/semana" element={<Navigate to="/calendario" replace />} />
        <Route path="/dia/:date" element={<DayDetail />} />
        <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
        <Route path="/progreso" element={<Progress />} />
        <Route path="/ajustes" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}
