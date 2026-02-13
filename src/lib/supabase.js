import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de seguridad: Esto te dirá en la consola si falta algo
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔥 Error: Las variables de entorno de Supabase no están cargadas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)