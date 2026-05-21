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
