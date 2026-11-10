/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_MOSTRAR_DEMO?: string
  readonly VITE_LOGIN_FALSO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
