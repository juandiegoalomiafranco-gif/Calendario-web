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

export default function App() {
  return (
    <PinGate>
      <Layout>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/semana" element={<Week />} />
          <Route path="/dia/:date" element={<DayDetail />} />
          <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
          <Route path="/colegio" element={<Colegio />} />
          <Route path="/colegio/clase/:code" element={<ClassDetail />} />
          <Route path="/progreso" element={<Progress />} />
          <Route path="/ajustes" element={<Settings />} />
        </Routes>
      </Layout>
    </PinGate>
  )
}
