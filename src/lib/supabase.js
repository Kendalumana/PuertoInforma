import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Esto crea el "teléfono" para llamar a tu base de datos
export const supabase = createClient(supabaseUrl, supabaseAnonKey)