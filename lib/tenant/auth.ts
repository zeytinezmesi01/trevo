import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createTenantForUser } from '@/lib/tenant/server'
import { redirect } from 'next/navigation'

export type TenantContext = {
  tenantId: string
  tenantName: string
  userId: string
  role: string
}

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .maybeSingle()

  let tenantId = profile?.tenant_id as string | null

  // Tenant yoksa otomatik oluştur — redirect döngüsünü önler
  if (!tenantId) {
    tenantId = await createTenantForUser(user.id)
    if (!tenantId) redirect('/giris')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()

  return {
    tenantId,
    tenantName: tenant?.name || 'İşletmem',
    userId: user.id,
    role: (profile?.role as string) || 'member',
  }
})

/**
 * getTenantContextApi — API route'ları için tenant context.
 * Kullanıcı oturumu yoksa HTML redirect yerine 401 JSON döndürür.
 */
export async function getTenantContextApi(): Promise<TenantContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const err = new Error('Oturum açmanız gerekiyor') as Error & { status: number }
    err.status = 401
    throw err
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .maybeSingle()

  let tenantId = profile?.tenant_id as string | null

  if (!tenantId) {
    tenantId = await createTenantForUser(user.id)
    if (!tenantId) {
      const err = new Error('Kiracı bulunamadı') as Error & { status: number }
      err.status = 401
      throw err
    }
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()

  return {
    tenantId,
    tenantName: tenant?.name || 'İşletmem',
    userId: user.id,
    role: (profile?.role as string) || 'member',
  }
}
