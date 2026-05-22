import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const WEBHOOK_FIELDS = 'id, url, events, active, description, created_at, updated_at'

async function getWebhookOr404(supabase: SupabaseClient, id: string, tenantId: string) {
  const { data } = await supabase
    .from('webhook_endpoints')
    .select(WEBHOOK_FIELDS)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return data
}

// PATCH /api/tenant/webhooks/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params

  const supabase = await createClient()
  const existing = await getWebhookOr404(supabase, id, ctx.tenantId)
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await request.json()
  const update: Record<string, unknown> = {}

  if (body.url !== undefined) update.url = body.url
  if (body.events !== undefined) update.events = body.events
  if (body.active !== undefined) update.active = body.active
  if (body.description !== undefined) update.description = body.description

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .update(update)
    .eq('id', id)
    .select(WEBHOOK_FIELDS)
    .single()

  if (error) {
    console.error('Webhook güncelleme hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
  return NextResponse.json(data)
}

// DELETE /api/tenant/webhooks/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const { id } = await params

  const supabase = await createClient()
  const existing = await getWebhookOr404(supabase, id, ctx.tenantId)
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await supabase.from('webhook_endpoints').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
