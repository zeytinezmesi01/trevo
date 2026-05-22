import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canManageServices } from '@/lib/tenant/permissions'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageServices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('services').delete().eq('id', id).eq('tenant_id', ctx.tenantId)
  if (error) {
    console.error('DELETE services error:', error)
    if (error.message?.includes('foreign key') || error.code === '23503') {
      return NextResponse.json({ error: 'Bu hizmete bağlı kayıtlar bulunuyor.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
