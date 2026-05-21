import { createClient } from '@/lib/supabase/server'

export async function createTenantForUser(userId: string): Promise<string | null> {
  const supabase = await createClient()

  // Check if user already has a tenant
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile?.tenant_id) return existingProfile.tenant_id as string

  // Get profile info for tenant name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', userId)
    .maybeSingle()

  const tenantName = profile?.company_name || profile?.full_name || 'İşletmem'

  // Create tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({ name: tenantName, owner_id: userId })
    .select('id')
    .single()

  if (!tenant) return null

  // Link profile to tenant
  await supabase
    .from('profiles')
    .update({ tenant_id: tenant.id, role: 'owner' })
    .eq('id', userId)

  // Add as tenant_member
  await supabase
    .from('tenant_members')
    .insert({ tenant_id: tenant.id, user_id: userId, role: 'owner', status: 'active', joined_at: new Date().toISOString() })

  return tenant.id as string
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
    .select('user_id')
    .eq('id', memberId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  await supabase.from('tenant_members').delete().eq('id', memberId).eq('tenant_id', tenantId)

  if (member?.user_id) {
    await supabase.from('profiles').update({ tenant_id: null, role: null }).eq('id', member.user_id)
  }
}

export async function getTenant(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle()
  return data
}
