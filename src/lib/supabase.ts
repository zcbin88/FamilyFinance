import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量，请复制 .env.example 为 .env.local 并填写 SUPABASE_URL 和 SUPABASE_ANON_KEY',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
