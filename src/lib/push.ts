import { supabase } from './supabase'

/**
 * Notificaciones push del iPhone.
 *
 * Condiciones que impone iOS y que conviene tener claras:
 *  - solo funciona con la app añadida a la pantalla de inicio (iOS 16.4+),
 *  - el permiso hay que pedirlo desde un gesto del usuario, no al cargar,
 *  - sin service worker no hay push.
 *
 * La suscripción se guarda en `push_subscriptions` y la Edge Function
 * `send-reminders` la usa para mandar el aviso de lo que vence mañana.
 */

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type PushEstado =
  | 'no-soportado'
  | 'requiere-instalar'
  | 'sin-permiso'
  | 'bloqueado'
  | 'activo'

/** ¿La app está corriendo como app instalada y no como pestaña del navegador? */
export function esStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS lo expone en una propiedad propia de Safari, fuera del estándar.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function soporteDePush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function estadoDePush(): Promise<PushEstado> {
  if (!soporteDePush()) {
    // En iPhone el soporte solo aparece cuando la app está instalada.
    return esIOS() && !esStandalone() ? 'requiere-instalar' : 'no-soportado'
  }
  if (Notification.permission === 'denied') return 'bloqueado'
  if (Notification.permission !== 'granted') return 'sin-permiso'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'activo' : 'sin-permiso'
}

function base64UrlABytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const normal = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normal)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function bytesABase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Registra el service worker. Se llama al arrancar la app. */
export async function registrarServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    console.warn('No se pudo registrar el service worker:', e)
  }
}

export interface ActivarResultado {
  ok: boolean
  estado: PushEstado
  error?: string
}

/** Pide permiso, se suscribe y guarda la suscripción. Requiere un gesto del usuario. */
export async function activarPush(): Promise<ActivarResultado> {
  if (!soporteDePush()) {
    const estado = esIOS() && !esStandalone() ? 'requiere-instalar' : 'no-soportado'
    return { ok: false, estado }
  }
  if (!VAPID_PUBLIC) {
    return { ok: false, estado: 'sin-permiso', error: 'Falta VITE_VAPID_PUBLIC_KEY.' }
  }

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    return { ok: false, estado: permiso === 'denied' ? 'bloqueado' : 'sin-permiso' }
  }

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlABytes(VAPID_PUBLIC),
    }))

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) {
    return { ok: false, estado: 'sin-permiso', error: 'Entra con tu código antes de activar los avisos.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      user_id: userId,
      p256dh: bytesABase64Url(sub.getKey('p256dh')),
      auth: bytesABase64Url(sub.getKey('auth')),
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' },
  )
  if (error) return { ok: false, estado: 'sin-permiso', error: error.message }

  return { ok: true, estado: 'activo' }
}

/** Deja de recibir avisos en ESTE dispositivo. */
export async function desactivarPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

/** Aviso de prueba, local: confirma que el permiso y el service worker están bien. */
export async function avisoDePrueba(): Promise<boolean> {
  if (Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('MyLife', {
    body: 'Los avisos están funcionando. Mañana te aviso de lo que venza.',
    icon: '/icon-192.png',
    tag: 'prueba',
  })
  return true
}
