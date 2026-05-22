import { NextResponse, after } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canCreateInvoices } from '@/lib/tenant/permissions'
import { listInvoices, createInvoice } from '@/lib/invoice/server'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export async function GET() {
  const ctx = await getTenantContext()
  const invoices = await listInvoices(ctx.tenantId)
  return NextResponse.json(invoices)
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  if (!canCreateInvoices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  const body = await request.json()

  // Girdi doğrulama
  if (!body.client_id || typeof body.client_id !== 'string') {
    return NextResponse.json({ error: 'Müşteri seçimi zorunludur' }, { status: 400 })
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'En az bir fatura kalemi gereklidir' }, { status: 400 })
  }
  for (const item of body.items) {
    if (!item.description || typeof item.description !== 'string') {
      return NextResponse.json({ error: 'Her kalem için açıklama zorunludur' }, { status: 400 })
    }
    if (typeof item.quantity !== 'number' || typeof item.unit_price !== 'number') {
      return NextResponse.json({ error: 'Kalem miktarı ve birim fiyatı sayı olmalıdır' }, { status: 400 })
    }
    // G-4: NaN/Infinity/negatif kontrolü
    if (!Number.isFinite(item.quantity) || !Number.isFinite(item.unit_price)) {
      return NextResponse.json({ error: 'Kalem miktarı ve birim fiyatı geçerli bir sayı olmalıdır' }, { status: 400 })
    }
    if (item.quantity <= 0 || item.unit_price < 0) {
      return NextResponse.json({ error: 'Miktar pozitif, birim fiyat sıfır veya pozitif olmalıdır' }, { status: 400 })
    }
  }

  const id = await createInvoice(ctx.tenantId, ctx.userId, body)
  const tenantId = ctx.tenantId

  after(() => {
    dispatchEvent(tenantId, WEBHOOK_EVENTS.INVOICE_CREATED, {
      id,
      invoice_number: body.invoice_number || '',
      client_name: body.client_name || '',
      total: body.items?.reduce((s: number, i: { quantity?: number; unit_price?: number }) => s + (i.quantity || 0) * (i.unit_price || 0), 0) || 0,
      status: 'draft',
    }).catch(() => {})
  })

  return NextResponse.json({ id })
}
