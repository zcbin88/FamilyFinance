/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Supabase 项目地址（Settings → API → Project URL） */
  readonly SUPABASE_URL: string
  /** Supabase 匿名密钥（Settings → API → anon public key） */
  readonly SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
