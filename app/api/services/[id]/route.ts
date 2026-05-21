import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()
  await supabase.from('services').delete().eq('id', id).eq('tenant_id', ctx.tenantId)
  return NextResponse.json({ ok: true })
}
