import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y rellena los valores.',
  )
}

/**
 * Dónde guarda supabase-js la sesión. Es el mismo nombre que pone la librería por
 * defecto (`sb-<proyecto>-auth-token`), escrito aquí a propósito: así las sesiones que
 * ya hay en el iPhone siguen valiendo, y `leerSesionGuardada` lee la misma clave aunque
 * una versión nueva de la librería cambiara su valor por defecto.
 */
export const CLAVE_SESION = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`

/**
 * La sesión que hay en ESTE dispositivo, leída en el acto y sin red.
 *
 * Existe para no esperar a `getSession()` al abrir la app: si el token caducó (lo normal
 * al reabrirla pasada una hora), esa llamada primero lo renueva por red, y en el celular
 * eso eran uno o dos segundos de pantalla vacía —o la pantalla vacía indefinidamente con
 * mala señal—. Con lo guardado se pinta al instante lo que ya hay en el dispositivo y la
 * renovación sigue por detrás. Pide lo mismo que supabase-js para darla por válida.
 */
export function leerSesionGuardada(): { userId: string } | null {
  try {
    const raw = localStorage.getItem(CLAVE_SESION)
    if (!raw) return null
    const s = JSON.parse(raw) as {
      access_token?: unknown
      refresh_token?: unknown
      expires_at?: unknown
      user?: { id?: unknown }
    }
    if (typeof s.access_token !== 'string' || typeof s.refresh_token !== 'string') return null
    if (s.expires_at == null || typeof s.user?.id !== 'string') return null
    return { userId: s.user.id }
  } catch {
    return null
  }
}

// Cliente único de Supabase. La sesión se guarda en localStorage y se refresca sola.
//
// La sesión la inicia el usuario con su código de acceso (ver src/lib/auth.ts y
// CodeGate). El mismo código abre la misma cuenta en cualquier dispositivo, que es
// justo lo que la sesión anónima anterior impedía: creaba un usuario distinto por
// dispositivo, así que el celular y el computador nunca veían los mismos datos.
export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: CLAVE_SESION,
  },
  realtime: {
    // Suficiente para una persona con dos dispositivos; evita ráfagas innecesarias.
    params: { eventsPerSecond: 5 },
  },
})
