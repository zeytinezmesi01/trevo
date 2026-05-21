import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canInviteMembers } from '@/lib/tenant/permissions'
import { sendTeamInvitation } from '@/lib/email'

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canInviteMembers(ctx.role)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { email, role } = await request.json()
  if (!email) return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })

  const supabase = (await import('@/lib/supabase/server')).createClient
  const client = await supabase()

  // Check for duplicate
  const { data: existing } = await client
    .from('team_invitations')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Bu e-postaya zaten davet gönderildi' }, { status: 409 })
  }

  // Check if already a member
  const { data: existingMember } = await client
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('user_id', (await client.from('profiles').select('id').eq('email', email).maybeSingle()).data?.id || '')
    .maybeSingle()

  // Create invitation
  const token = Array.from({ length: 64 }, () => Math.random().toString(36)[2]).join('')
  const { data: invitation, error } = await client
    .from('team_invitations')
    .insert({
      tenant_id: ctx.tenantId,
      email,
      role: role || 'member',
      token,
      invited_by: ctx.userId,
    })
    .select('token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100'
  const inviteUrl = `${baseUrl}/kayit?invite=${token}`

  await sendTeamInvitation({
    email,
    tenantName: ctx.tenantName,
    inviteUrl,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
