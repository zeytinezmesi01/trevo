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

  return NextResponse.json({ ok: true, tenantId: invitation.tenant_id })
}
