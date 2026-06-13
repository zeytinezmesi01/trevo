import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cleanupAutoCreatedTenant } from '@/lib/tenant/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  // Tenant'i body'den DEĞIL, request host'undan türet.
  // Sadece brand_domain_status === 'active' olan domain'ler kabul edilir.
  const host = request.headers.get('host') || ''
  const domain = host.replace(/:\d+$/, '').replace(/^www\./, '').toLowerCase()

  if (!domain) {
    return NextResponse.json({ error: 'Domain bilgisi alınamadı' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Domain sahibini bul (yalnızca aktif/doğrulanmış domain'ler).
  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('id, brand_domain_status')
    .eq('brand_domain', domain)
    .maybeSingle()

  if (!ownerProfile || ownerProfile.brand_domain_status !== 'active') {
    return NextResponse.json({ error: 'Doğrulanmış bir işletme domaini bulunamadı' }, { status: 404 })
  }

  // Domain'in tenant'ı: domain sahibinin SAHİBİ olduğu tenant
  // (tenants.owner_id UNIQUE — profiles.tenant_id artık yok)
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name')
    .eq('owner_id', ownerProfile.id)
    .maybeSingle()

  if (!tenant) {
    return NextResponse.json({ error: 'Bu domain\'e ait isletme bulunamadi' }, { status: 404 })
  }

  const tenantId = tenant.id as string

  // Kullanici zaten bu tenant'ta mi?
  const { data: existingMember } = await admin
    .from('tenant_members')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    if (existingMember.status === 'active') {
      return NextResponse.json({ status: 'already_member', tenantId })
    }
    // Pending/rejected uyeligi aktife cevir
    await admin
      .from('tenant_members')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', existingMember.id)
  } else {
    // Yeni uye ekle
    await admin
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
  }

  // Çoklu tenant: eski üyelikler korunur; katıldığı tenant aktif yapılır
  const { data: profile } = await admin
    .from('profiles')
    .select('active_tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const oldTenantId = profile?.active_tenant_id

  await admin
    .from('profiles')
    .update({ active_tenant_id: tenantId })
    .eq('id', user.id)

  // Trigger'in auto-created BOŞ tenant'ini temizle (doluysa kalır)
  if (oldTenantId && oldTenantId !== tenantId) {
    await cleanupAutoCreatedTenant(user.id, oldTenantId)
  }

  return NextResponse.json({ status: 'joined', tenantId, tenantName: tenant.name })
}
