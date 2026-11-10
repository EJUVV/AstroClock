import { createClient } from '@supabase/supabase-js'
import type { Database } from './tipos-banco.ts'

// Tipado com as tabelas do banco: um erro de nome de coluna aparece já no editor.
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'chave-ausente',
)
