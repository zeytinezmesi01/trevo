import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const tenantId = body?.tenant_id as string | undefined

  if (!tenantId) {
    return NextResponse.json({ error: 'Domain bilgisi eksik' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Domain sahibinin tenant'ini bul
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Bu domain\'e ait isletme bulunamadi' }, { status: 404 })
  }

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

  // Profili KEY'in tenant'ina tasi (trigger'in auto-created tenant'ini ezer)
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const oldTenantId = profile?.tenant_id

  await admin
    .from('profiles')
    .update({ tenant_id: tenantId, role: 'member' })
    .eq('id', user.id)

  // Trigger'in auto-created bos tenant'ini temizle
  if (oldTenantId && oldTenantId !== tenantId) {
    await admin
      .from('tenant_members')
      .delete()
      .eq('tenant_id', oldTenantId)
      .eq('user_id', user.id)
    const { count } = await admin
      .from('tenant_members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', oldTenantId)
    if (count === 0) {
      await admin
        .from('tenants')
        .delete()
        .eq('id', oldTenantId)
    }
  }

  return NextResponse.json({ status: 'joined', tenantId, tenantName: tenant.name })
}
