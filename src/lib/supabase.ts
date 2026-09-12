import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Antes esto hacía `throw` en el import y la app quedaba en pantalla blanca cuando
 * faltaba el `.env`. Ahora el cliente puede ser null y la interfaz muestra un aviso
 * de configuración, que es mucho más fácil de diagnosticar.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

export const isConfigured = supabase !== null

/** El cliente cuando de verdad existe; lanza solo si alguien lo llama sin configurar. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase no está configurado: falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
  return supabase
}
