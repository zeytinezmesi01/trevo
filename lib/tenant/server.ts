import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createTenantForUser(userId: string): Promise<string | null> {
  // RLS bypass: kullanıcı daha tenant'a bağlı olmayabilir, profil/tenant bootstrap'ı
  // için admin client kullan
  const admin = createAdminClient()

  // 1. Profile already linked to a tenant → done
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('tenant_id, full_name, company_name')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile?.tenant_id) return existingProfile.tenant_id as string

  // 2. A tenant may already exist for this user (tenants.owner_id is UNIQUE) —
  //    reuse it instead of inserting a duplicate that would violate the index
  const { data: existingTenant } = await admin
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  let tenantId = existingTenant?.id as string | undefined

  // 3. Create the tenant if none exists
  if (!tenantId) {
    const tenantName =
      (existingProfile?.company_name as string) ||
      (existingProfile?.full_name as string) ||
      'İşletmem'
    const { data: tenant } = await admin
      .from('tenants')
      .insert({ name: tenantName, owner_id: userId })
      .select('id')
      .single()
    if (!tenant) return null
    tenantId = tenant.id as string
  }

  // 4. Upsert the profile so it always exists and is linked
  //    (handles users whose profile row was never created)
  await admin
    .from('profiles')
    .upsert({ id: userId, tenant_id: tenantId, role: 'owner' })

  // 5. Ensure a tenant_members row exists
  await admin
    .from('tenant_members')
    .upsert(
      { tenant_id: tenantId, user_id: userId, role: 'owner', status: 'active', joined_at: new Date().toISOString() },
      { onConflict: 'tenant_id,user_id' }
    )

  return tenantId
}

export async function getTenantMembers(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_members')
    .select('id, user_id, role, status, joined_at, invited_at')
    .eq('tenant_id', tenantId)
    .order('joined_at', { ascending: false })

  return data || []
}

export async function getTenantInvitations(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('team_invitations')
    .select('id, email, role, status, created_at, expires_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function removeTenantMember(tenantId: string, memberId: string) {
  const supabase = await createClient()
  // Fetch user_id BEFORE deleting — row won't exist after delete
  const { data: member } = await supabase
    .from('tenant_members')
    .select('user_id, role')
    .eq('id', memberId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  // Owner çıkarılamaz
  if (member?.role === 'owner') {
    throw new Error('Kiracı sahibi çıkarılamaz')
  }

  await supabase.from('tenant_members').delete().eq('id', memberId).eq('tenant_id', tenantId)

  if (member?.user_id) {
    await supabase.from('profiles').update({ tenant_id: null, role: null }).eq('id', member.user_id)
  }
}

export async function getTenant(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id, name, owner_id, created_at, updated_at')
    .eq('id', tenantId)
    .maybeSingle()
  return data
}
