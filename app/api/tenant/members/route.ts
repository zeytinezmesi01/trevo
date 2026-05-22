import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { getTenantMembers, getTenantInvitations, removeTenantMember } from '@/lib/tenant/server'
import { canRemoveMembers } from '@/lib/tenant/permissions'

export async function GET() {
  const ctx = await getTenantContext()
  const [members, invitations] = await Promise.all([
    getTenantMembers(ctx.tenantId),
    getTenantInvitations(ctx.tenantId),
  ])
  return NextResponse.json({ members, invitations })
}

export async function DELETE(request: Request) {
  const ctx = await getTenantContext()
  if (!canRemoveMembers(ctx.role)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { memberId } = await request.json()
  try {
    await removeTenantMember(ctx.tenantId, memberId)
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Üye çıkarılamadı',
    }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
