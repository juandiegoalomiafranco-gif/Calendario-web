import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { Today } from './pages/Today'
import { Week } from './pages/Week'
import { DayDetail } from './pages/DayDetail'
import { Progress } from './pages/Progress'
import { Goals } from './pages/Goals'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

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
        <Route path="/metas" element={<Goals />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
