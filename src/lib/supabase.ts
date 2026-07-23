import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y rellena los valores.',
  )
}

// Cliente único de Supabase. La sesión se guarda en localStorage y se refresca sola.
export const supabase = createClient(url, publishableKey, {
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
void supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    void supabase.auth.signInAnonymously().then(({ error }) => {
      if (error) {
        console.warn(
          'Sesión anónima no disponible (activa "Anonymous sign-ins" en Supabase):',
          error.message,
        )
      }
    })
  }
})
