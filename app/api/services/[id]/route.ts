import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { canManageServices } from '@/lib/tenant/permissions'

// D-14: GET ve PATCH eksikti
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()
  if (error) {
    console.error('GET services/[id] error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageServices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (typeof body.name === 'string') update.name = body.name
  if (body.price != null && body.price !== '') update.price = Number(body.price)
  if (body.delivery !== undefined) update.delivery = body.delivery || null
  if (body.description !== undefined) update.description = body.description || null
  if (typeof body.status === 'string') update.status = body.status

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('PATCH services/[id] error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}

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
