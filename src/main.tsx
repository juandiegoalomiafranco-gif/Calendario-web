import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { refrescarSuscripcionPush, registrarServiceWorker } from './lib/push'
import './styles/index.css'

// El service worker solo sirve para las notificaciones; no cachea nada.
void registrarServiceWorker().then(refrescarSuscripcionPush)
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
