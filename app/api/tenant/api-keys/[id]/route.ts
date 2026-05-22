import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// DELETE /api/tenant/api-keys/[id] — anahtarı iptal et (revoke)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('api_keys')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
