import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContext()
  const { id } = await params

  // Sadece owner key silebilir
  if (ctx.role !== 'owner') {
    return NextResponse.json({ error: 'Sadece isletme sahibi kayit anahtarini iptal edebilir' }, { status: 403 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('registration_keys')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) {
    return NextResponse.json({ error: 'Key silinemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
