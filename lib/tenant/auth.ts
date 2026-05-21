import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
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

  if (!profile?.tenant_id) redirect('/giris')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', profile.tenant_id)
    .maybeSingle()

  return {
    tenantId: profile.tenant_id as string,
    tenantName: tenant?.name || 'İşletmem',
    userId: user.id,
    role: (profile.role as string) || 'member',
  }
})
