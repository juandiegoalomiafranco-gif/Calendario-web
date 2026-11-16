import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { cuandoHayaCalma } from './lib/arranque'
import { refrescarSuscripcionPush, registrarServiceWorker } from './lib/push'
import { precargarPantallas } from './pantallas'
import './styles/index.css'

// El service worker solo sirve para las notificaciones; no cachea nada. Registrarlo
// descarga `sw.js`: no tiene por qué competir con la primera pantalla.
cuandoHayaCalma(() => void registrarServiceWorker().then(refrescarSuscripcionPush))
// Las demás pantallas van en trozos aparte; se bajan en cuanto hay calma para que
// navegar siga siendo instantáneo.
cuandoHayaCalma(precargarPantallas)
// Al volver a la app se repasa la suscripción: el servidor pudo haberla dado de baja.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void refrescarSuscripcionPush()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
