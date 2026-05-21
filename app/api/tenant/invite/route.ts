import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canInviteMembers } from '@/lib/tenant/permissions'
import { sendTeamInvitation } from '@/lib/email'

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canInviteMembers(ctx.role)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { email, role } = await request.json()
  if (!email) return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })

  const supabase = await createClient()

  // Aynı e-postaya bekleyen davet var mı?
  const { data: existing } = await supabase
    .from('team_invitations')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Bu e-postaya zaten davet gönderildi' }, { status: 409 })
  }

  const token = Array.from({ length: 64 }, () => Math.random().toString(36)[2]).join('')
  const { error } = await supabase
    .from('team_invitations')
    .insert({
      tenant_id: ctx.tenantId,
      email,
      role: role || 'member',
      token,
      invited_by: ctx.userId,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/kayit?invite=${token}`

  await sendTeamInvitation({
    email,
    tenantName: ctx.tenantName,
    inviteUrl,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
