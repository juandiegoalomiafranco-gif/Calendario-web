import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { PinGate } from './components/PinGate'
import { Today } from './pages/Today'
import { Week } from './pages/Week'
import { DayDetail } from './pages/DayDetail'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'
import { Colegio } from './pages/Colegio'
import { ClassDetail } from './pages/ClassDetail'
import { Entreno } from './pages/Entreno'
import { Strength } from './pages/Strength'
import { GymNotes } from './pages/GymNotes'
import { BodyProgress } from './pages/BodyProgress'
import { Mas } from './pages/Mas'
import { Placeholder } from './pages/Placeholder'

export default function App() {
  return (
    <PinGate>
      <Layout>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/colegio" element={<Colegio />} />
          <Route path="/colegio/clase/:code" element={<ClassDetail />} />
          <Route path="/entreno" element={<Entreno />} />
          <Route path="/entreno/fuerza" element={<Strength />} />
          <Route path="/entreno/notas" element={<GymNotes />} />
          <Route path="/comida" element={<Placeholder title="Comida" emoji="🍎" />} />
          <Route path="/mas" element={<Mas />} />
          <Route path="/cuerpo" element={<BodyProgress />} />
          <Route path="/finanzas" element={<Placeholder title="Finanzas" emoji="💰" />} />
          <Route path="/calendario" element={<Placeholder title="Calendario" emoji="📅" />} />
          <Route path="/pendientes" element={<Placeholder title="Pendientes" emoji="✅" />} />
          <Route path="/semana" element={<Week />} />
          <Route path="/dia/:date" element={<DayDetail />} />
          <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
          <Route path="/progreso" element={<Progress />} />
          <Route path="/ajustes" element={<Settings />} />
        </Routes>
      </Layout>
    </PinGate>
  )
}
