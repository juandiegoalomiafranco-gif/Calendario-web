/*
 * Service worker de MyLife: solo notificaciones.
 *
 * No cachea nada a propósito. La app la sirve Vercel con sus propias cabeceras y
 * meter aquí una capa de caché sería la forma más fácil de quedarse con una versión
 * vieja pegada en el iPhone sin saber por qué.
 *
 * En iOS las notificaciones push solo funcionan si la app está añadida a la pantalla
 * de inicio (iOS 16.4+).
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { title: 'MyLife', body: event.data ? event.data.text() : '' }
  }

  const title = datos.title || 'MyLife'
  const options = {
    body: datos.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: datos.tag || 'mylife',
    // Si llega otro aviso del mismo tipo, reemplaza al anterior en vez de apilarse.
    renotify: true,
    data: { url: datos.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destino = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      // Si la app ya está abierta, se enfoca esa pestaña en vez de abrir otra.
      for (const c of clientes) {
        if ('focus' in c) {
          c.navigate(destino)
          return c.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
