import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { CodeGate } from './components/CodeGate'
// El Inicio va en el archivo principal: es lo que se abre casi siempre y tiene que
// pintarse sin esperar a nada más. El resto de pantallas se baja aparte (ver pantallas.ts).
import { Today } from './pages/Today'
import {
  BodyProgress,
  Calendario,
  ClassDetail,
  Clases,
  Colegio,
  Comida,
  DayDetail,
  Entreno,
  Finanzas,
  GymNotes,
  Mas,
  Materias,
  NotaDetalle,
  Pendientes,
  Progress,
  Settings,
  Strength,
  Week,
} from './pantallas'

export default function App() {
  return (
    <CodeGate>
      <AppShell>
        <ScrollToTop />
        {/*
         * Solo se ve si se abre una pantalla que todavía no se ha bajado (normalmente ya
         * está precargada). Es un hueco vacío a propósito: un indicador que aparece y
         * desaparece en una décima de segundo se lee como un parpadeo.
         */}
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/colegio" element={<Colegio />} />
            <Route path="/colegio/clase/:code" element={<ClassDetail />} />
            <Route path="/colegio/clase/:code/nota/:id" element={<NotaDetalle />} />
            <Route path="/clases" element={<Clases />} />
            <Route path="/materias" element={<Materias />} />
            <Route path="/entreno" element={<Entreno />} />
            <Route path="/entreno/fuerza" element={<Strength />} />
            <Route path="/entreno/notas" element={<GymNotes />} />
            <Route path="/comida" element={<Comida />} />
            <Route path="/mas" element={<Mas />} />
            <Route path="/cuerpo" element={<BodyProgress />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/pendientes" element={<Pendientes />} />
            <Route path="/semana" element={<Week />} />
            <Route path="/dia/:date" element={<DayDetail />} />
            <Route path="/dia/:date/:sessionId" element={<DayDetail />} />
            <Route path="/progreso" element={<Progress />} />
            <Route path="/ajustes" element={<Settings />} />
            {/* Cualquier otra ruta vuelve al inicio en vez de dejar la pantalla en blanco */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </CodeGate>
  )
}
