import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { canDeleteInvoices } from '@/lib/tenant/permissions'
import { getInvoice, deleteInvoice } from '@/lib/invoice/server'
import { createClient } from '@/lib/supabase/server'

const EDITABLE = [
  'client_id', 'client_name', 'client_company', 'client_email',
  'client_tax_office', 'client_tax_number', 'client_address', 'client_city',
  'invoice_date', 'due_date', 'notes', 'currency',
  'subtotal', 'kdv_rate', 'kdv_amount', 'tevkifat_rate', 'tevkifat_amount',
  'total', 'vat_exempt', 'withholding_tax',
] as const

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: ['cancelled'],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const invoice = await getInvoice(id, ctx.tenantId)
  if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  if (!canDeleteInvoices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await request.json()
  const { status, ...rest } = body

  // G-3: Sadece izin verilen alanları güncelle
  const updateData: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in rest) updateData[key] = rest[key]
  }

  updateData.updated_at = new Date().toISOString()

  const supabase = await createClient()

  // G-2: Statü geçiş kontrolü
  if (status) {
    const { data: current } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle()

    if (current && current.status !== status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[current.status as string] || []
      if (!allowed.includes(status)) {
        return NextResponse.json({
          error: `"${current.status}" durumundan "${status}" durumuna geçiş yapılamaz`,
        }, { status: 400 })
      }
    }

    updateData.status = status

    // G-3: Manuel paid işaretleme
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }
  }

  await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  if (!canDeleteInvoices(ctx.role)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  await deleteInvoice(id, ctx.tenantId)
  return NextResponse.json({ ok: true })
}
