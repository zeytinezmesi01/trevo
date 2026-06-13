import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cleanupAutoCreatedTenant } from '@/lib/tenant/server'

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

  // Çoklu tenant: eski üyelikler KORUNUR; sadece kayıt trigger'ının boş
  // oto-tenant'ı temizlenir (içinde veri/üye varsa dokunulmaz).
  const { data: oldProfile } = await admin
    .from('profiles')
    .select('active_tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  const oldTenantId = oldProfile?.active_tenant_id

  // Add to tenant_members
  await admin.from('tenant_members').insert({
    tenant_id: invitation.tenant_id,
    user_id: user.id,
    role: invitation.role,
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  // Katıldığı tenant'ı aktif yap
  await admin.from('profiles').update({
    active_tenant_id: invitation.tenant_id,
  }).eq('id', user.id)

  // Mark invitation accepted
  await admin.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id)

  // Y-11: Trigger'in auto-created BOŞ tenant'ini temizle (doluysa kalır)
  if (oldTenantId && oldTenantId !== invitation.tenant_id) {
    await cleanupAutoCreatedTenant(user.id, oldTenantId)
  }

  return NextResponse.json({ ok: true, tenantId: invitation.tenant_id })
}
