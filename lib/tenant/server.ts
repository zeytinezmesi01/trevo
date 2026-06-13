import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createTenantForUser(userId: string): Promise<string | null> {
  // RLS bypass: kullanıcı daha tenant'a bağlı olmayabilir, profil/tenant bootstrap'ı
  // için admin client kullan
  const admin = createAdminClient()

  // 1. Aktif bir üyelik varsa onu kullan (profiles.active_tenant_id öncelikli)
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    admin.from('profiles').select('active_tenant_id, full_name, company_name').eq('id', userId).maybeSingle(),
    admin.from('tenant_members').select('tenant_id').eq('user_id', userId).eq('status', 'active'),
  ])

  if (memberships && memberships.length > 0) {
    const active =
      memberships.find((m) => m.tenant_id === profile?.active_tenant_id)?.tenant_id ||
      (memberships[0].tenant_id as string)
    if (profile?.active_tenant_id !== active) {
      await admin.from('profiles').upsert({ id: userId, active_tenant_id: active })
    }
    return active as string
  }

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
      (profile?.company_name as string) ||
      (profile?.full_name as string) ||
      'İşletmem'
    const { data: tenant } = await admin
      .from('tenants')
      .insert({ name: tenantName, owner_id: userId })
      .select('id')
      .single()
    if (!tenant) return null
    tenantId = tenant.id as string
  }

  // 4. Upsert the profile so it always exists and points at the tenant
  await admin
    .from('profiles')
    .upsert({ id: userId, active_tenant_id: tenantId })

  // 5. Ensure a tenant_members row exists — üyelik kaynağı burası
  await admin
    .from('tenant_members')
    .upsert(
      { tenant_id: tenantId, user_id: userId, role: 'owner', status: 'active', joined_at: new Date().toISOString() },
      { onConflict: 'tenant_id,user_id' }
    )

  return tenantId
}

/**
 * Davet/anahtar/domain üzerinden başka tenant'a katılan kullanıcının, kayıt
 * trigger'ının oluşturduğu BOŞ oto-tenant'ını temizler. İçinde herhangi bir
 * veri (müşteri/fatura/dosya/hizmet) veya başka üye varsa DOKUNMAZ —
 * çoklu tenant modelinde kullanıcı kendi işletmesini kaybetmemeli.
 */
export async function cleanupAutoCreatedTenant(userId: string, tenantId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, owner_id')
    .eq('id', tenantId)
    .maybeSingle()
  if (!tenant || tenant.owner_id !== userId) return

  const [{ count: members }, { count: clients }, { count: invoices }, { count: files }, { count: services }] =
    await Promise.all([
      admin.from('tenant_members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      admin.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      admin.from('invoices').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      admin.from('files').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      admin.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])

  const onlySelf = (members || 0) <= 1
  const empty = (clients || 0) === 0 && (invoices || 0) === 0 && (files || 0) === 0 && (services || 0) === 0
  if (!onlySelf || !empty) return

  // FK cascade üyeliği de siler
  await admin.from('tenants').delete().eq('id', tenantId)
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

  // Çıkarılan üyenin seçili tenant'ı buysa sıfırla — bir sonraki isteğinde
  // kalan üyeliğine (veya yeni oto-tenant'ına) düşer. Kullanıcının kendi
  // profili RLS gereği admin client ister.
  if (member?.user_id) {
    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ active_tenant_id: null })
      .eq('id', member.user_id)
      .eq('active_tenant_id', tenantId)
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
