import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // RLS bypass: kullanıcı henüz tenant üyesi değil bootstrap aşamasında
  const admin = createAdminClient()
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })

  // Find the invitation
  const { data: invitation } = await admin
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle()

  if (!invitation) {
    return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş davet' }, { status: 404 })
  }

  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await admin.from('team_invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return NextResponse.json({ error: 'Davet süresi doldu' }, { status: 410 })
  }

  // Get current user — oturum cookie tabanlı istemciden alınır
  // (admin client service-role ile çalışır, oturumu yoktur)
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Önce giriş yapmalısınız' }, { status: 401 })

  // Check email match
  if (user.email !== invitation.email) {
    return NextResponse.json({ error: 'Bu davet farklı bir e-posta için' }, { status: 403 })
  }

  // Kullanıcı zaten üye mi kontrol et
  const { data: existingMember } = await admin
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', invitation.tenant_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    return NextResponse.json({ error: 'Bu takıma zaten üyesiniz' }, { status: 409 })
  }

  // Y-11: Eski tenant'i temizlemeden önce kaydet
  const { data: oldProfile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const oldTenantId = oldProfile?.tenant_id

  // Add to tenant_members
  await admin.from('tenant_members').insert({
    tenant_id: invitation.tenant_id,
    user_id: user.id,
    role: invitation.role,
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  // Update profile
  await admin.from('profiles').update({
    tenant_id: invitation.tenant_id,
    role: invitation.role,
  }).eq('id', user.id)

  // Mark invitation accepted
  await admin.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id)

  // Y-11: Trigger'in auto-created bos tenant'ini temizle
  if (oldTenantId && oldTenantId !== invitation.tenant_id) {
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
      await admin.from('tenants').delete().eq('id', oldTenantId)
    }
  }

  return NextResponse.json({ ok: true, tenantId: invitation.tenant_id })
}
