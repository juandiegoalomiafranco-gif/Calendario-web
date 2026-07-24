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

// La sesión la inicia el usuario con su código de acceso (ver src/lib/auth.ts y CodeGate).
// El mismo código abre la misma cuenta en cualquier dispositivo; RLS protege por auth.uid().
