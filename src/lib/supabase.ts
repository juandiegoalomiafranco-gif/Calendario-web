import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Si faltan las variables, la app **no se cae**: funciona solo con
 * `localStorage`. Antes lanzaba un error al importar, así que un despliegue mal
 * configurado se veía como una pantalla en blanco.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY: la app guardará solo en este dispositivo. ' +
      'Copia .env.example a .env (o define las variables en el hosting) para sincronizar con la nube.',
  )
}

// Cliente único de Supabase. La sesión se guarda en localStorage y se refresca sola.
// Sin configuración se crea igual, con valores de relleno, para no tener que
// comprobar `null` en cada llamada: nadie lo usa porque `isSupabaseConfigured` es false.
export const supabase = createClient(url || 'https://placeholder.supabase.co', publishableKey || 'sin-configurar', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Sesión anónima automática: la app NO tiene login. En la primera carga se crea una
// sesión anónima (sin correo ni contraseña) para tener un auth.uid() y que RLS proteja
// los datos por dispositivo. Requiere "Anonymous sign-ins" activado en Supabase; si está
// apagado, la app sigue funcionando solo con localStorage (no se rompe nada).
if (isSupabaseConfigured) {
  void supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      void supabase.auth.signInAnonymously().then(({ error }) => {
        if (error) {
          console.warn('Sesión anónima no disponible (activa "Anonymous sign-ins" en Supabase):', error.message)
        }
      })
    }
  })
}
