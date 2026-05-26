import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canManageTenant } from '@/lib/tenant/permissions'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST /api/tenant/webhook-deliveries/[id]/retry — teslimatı yeniden dene
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  if (!canManageTenant(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const supabase = await createClient()
  const { id } = await params

  const { data: delivery } = await supabase
    .from('webhook_deliveries')
    .select('id, endpoint_id, event_type, payload, response_status, response_body, attempts')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!delivery) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // Endpoint'i bul
  const { data: endpoint } = await supabase
    .from('webhook_endpoints')
    .select('url, secret')
    .eq('id', delivery.endpoint_id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!endpoint) return NextResponse.json({ error: 'Webhook endpoint bulunamadı' }, { status: 404 })

  // Önceki yanıtı koru — tekrar deneme geçmişini kaybetme
  await supabase
    .from('webhook_deliveries')
    .update({
      status: 'pending',
      attempts: 0,
      previous_response_status: delivery.response_status,
      previous_response_body: delivery.response_body,
      response_status: null,
      response_body: null,
    })
    .eq('id', id)

  // Arka planda gönderim dene
  const { dispatchEvent } = await import('@/lib/webhooks/dispatch')
  dispatchEvent(ctx.tenantId, delivery.event_type, delivery.payload as Record<string, unknown>)
    .catch(() => {})

  return NextResponse.json({ ok: true, message: 'Tekrar gönderiliyor' })
}
