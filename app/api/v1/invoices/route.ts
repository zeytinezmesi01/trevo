import { NextResponse, after } from 'next/server'
import { authenticateApiRequestOrThrow } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasMinRole } from '@/lib/tenant/permissions'
import { createInvoice } from '@/lib/invoice/server'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export const runtime = 'nodejs'

async function authHandler(request: Request) {
  const auth = await authenticateApiRequestOrThrow(request)
  return { ...auth, admin: createAdminClient() }
}

function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : 'Yetkisiz'
  const status = (e as Error & { status?: number }).status || 401
  return NextResponse.json({ error: msg }, { status })
}

type InvoiceItem = { quantity: number; unit_price: number }

// GET /api/v1/invoices
export async function GET(request: Request) {
  try {
    const { tenantId, admin } = await authHandler(request)
    const url = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25', 10) || 25, 1), 100)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)
    const statusFilter = url.searchParams.get('status')

    let query = admin
      .from('invoices')
      .select('id, invoice_number, client_name, client_company, client_email, status, subtotal, kdv_rate, kdv_amount, tevkifat_rate, tevkifat_amount, total, amount_paid, invoice_date, due_date, notes, einvoice_status, einvoice_type, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, error } = await query.range(offset, offset + limit - 1)
    if (error) {
      console.error('v1 GET invoices error:', error)
      return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (e: unknown) {
    return handleError(e)
  }
}

// POST /api/v1/invoices
export async function POST(request: Request) {
  try {
    const { tenantId, role, admin } = await authHandler(request)
    if (!hasMinRole(role, 'member')) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }
    const body = await request.json()

    if (!body.client_id || typeof body.client_id !== 'string') {
      return NextResponse.json({ error: 'client_id zorunludur' }, { status: 400 })
    }
    if (!body.client_name || typeof body.client_name !== 'string') {
      return NextResponse.json({ error: 'client_name zorunludur' }, { status: 400 })
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'En az bir fatura kalemi (items) zorunludur' }, { status: 400 })
    }

    for (const item of body.items) {
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unit_price !== 'number') {
        return NextResponse.json({ error: 'Her kalem description, quantity ve unit_price içermelidir' }, { status: 400 })
      }
    }

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', body.client_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!client) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    const { data: tenant } = await admin
      .from('tenants')
      .select('owner_id')
      .eq('id', tenantId)
      .maybeSingle()

    const id = await createInvoice(tenantId, tenant?.owner_id || '', body, admin)

    after(() => {
      const items: InvoiceItem[] = body.items || []
      const total = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)

      dispatchEvent(tenantId, WEBHOOK_EVENTS.INVOICE_CREATED, {
        id,
        invoice_number: body.invoice_number || '',
        client_name: body.client_name || '',
        total,
        status: 'draft',
      }).catch(() => {})
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (e: unknown) {
    return handleError(e)
  }
}
