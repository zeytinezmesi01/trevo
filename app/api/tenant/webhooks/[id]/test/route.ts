import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export const runtime = 'nodejs'

// POST /api/tenant/webhooks/[id]/test — sahte event gönder
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const supabase = await createClient()
  const { id } = await params

  const { data: webhook } = await supabase
    .from('webhook_endpoints')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!webhook) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // Test event'ini arka planda dispatch et
  dispatchEvent(ctx.tenantId, WEBHOOK_EVENTS.INVOICE_CREATED, {
    test: true,
    message: 'Bu bir test bildirimidir.',
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: 'Test event\'i gönderildi' })
}
