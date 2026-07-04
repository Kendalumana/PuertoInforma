import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function createDisabledSupabaseClient() {
  const configError = new Error('Faltan variables de entorno: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: configError }),
      refreshSession: async () => ({ data: { session: null }, error: configError }),
      signInWithOAuth: async () => ({ data: null, error: configError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
  }
}

// Esto crea el "teléfono" para llamar a tu base de datos.
// Si falta configuración, la app sigue renderizando y los flujos de Supabase fallan de forma controlada.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDisabledSupabaseClient()
