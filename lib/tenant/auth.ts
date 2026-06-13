import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createTenantForUser } from '@/lib/tenant/server'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TenantMembership = {
  tenantId: string
  tenantName: string
  role: string
}

export type TenantContext = {
  tenantId: string
  tenantName: string
  userId: string
  role: string
  /** Kullanıcının aktif üyelikleri — tenant switcher bu listeden beslenir */
  memberships: TenantMembership[]
}

/**
 * Çoklu tenant modeli: üyelikler tenant_members'ta, seçili tenant
 * profiles.active_tenant_id'de tutulur. active_tenant_id geçerli bir üyeliği
 * göstermiyorsa ilk üyeliğe düşer; hiç üyelik yoksa tenant oluşturulur.
 */
async function resolveTenantContext(supabase: SupabaseClient, userId: string): Promise<TenantContext | null> {
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('active_tenant_id').eq('id', userId).maybeSingle(),
    supabase
      .from('tenant_members')
      .select('tenant_id, role, tenants(name)')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ])

  let memberships: TenantMembership[] = (rows || []).map((m) => ({
    tenantId: m.tenant_id as string,
    tenantName: ((m.tenants as { name?: string } | null)?.name as string) || 'İşletmem',
    role: (m.role as string) || 'member',
  }))

  // Üyelik yoksa otomatik tenant oluştur — redirect döngüsünü önler
  if (memberships.length === 0) {
    const tenantId = await createTenantForUser(userId)
    if (!tenantId) return null
    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle()
    memberships = [{ tenantId, tenantName: tenant?.name || 'İşletmem', role: 'owner' }]
  }

  const active =
    memberships.find((m) => m.tenantId === profile?.active_tenant_id) || memberships[0]

  // Seçim geçersizse (üyelik silinmiş, hiç seçilmemiş) ilk üyeliğe sabitle
  if (profile?.active_tenant_id !== active.tenantId) {
    await supabase.from('profiles').update({ active_tenant_id: active.tenantId }).eq('id', userId)
  }

  return {
    tenantId: active.tenantId,
    tenantName: active.tenantName,
    userId,
    role: active.role,
    memberships,
  }
}

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const ctx = await resolveTenantContext(supabase, user.id)
  if (!ctx) redirect('/giris')
  return ctx
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

  const ctx = await resolveTenantContext(supabase, user.id)
  if (!ctx) {
    const err = new Error('Kiracı bulunamadı') as Error & { status: number }
    err.status = 401
    throw err
  }
  return ctx
}
