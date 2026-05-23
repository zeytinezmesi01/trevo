import { createClient } from '@supabase/supabase-js'

// Service role client — SADECE sunucu tarafında, admin işlemleri için.
// auth.admin gibi yetki gerektiren işlemlerde kullanılır.
// RLS'yi bypass eder, dikkatli kullan.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var is required')
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required')

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
