import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { Today } from './pages/Today'
import { Week } from './pages/Week'
import { DayDetail } from './pages/DayDetail'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'
import { MeasurementWizard } from './components/MeasurementWizard'

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/semana" element={<Week />} />
        <Route path="/dia/:date" element={<DayDetail />} />
        <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
        <Route path="/progreso" element={<Progress />} />
        <Route path="/progreso/nuevo-control" element={<MeasurementWizard />} />
        <Route path="/progreso/control/:id/editar" element={<MeasurementWizard />} />
        <Route path="/ajustes" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
