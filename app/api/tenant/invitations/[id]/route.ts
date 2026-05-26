import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canInviteMembers } from '@/lib/tenant/permissions'

// O-32: davet iptali için dedike API route — direkt supabase client kullanımı kaldırıldı
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContext()
  if (!canInviteMembers(ctx.role)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }
  const { id } = await params

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_invitations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .in('status', ['pending', 'expired'])

  if (error) {
    return NextResponse.json({ error: 'Davet iptal edilemedi' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
