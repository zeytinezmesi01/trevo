import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchEvent } from '@/lib/webhooks/dispatch'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .rpc('next_invoice_number', { p_tenant_id: tenantId })
    .maybeSingle()
  const row = data as { seq_prefix: string; seq_year: number; seq_number: number } | null
  const prefix = row?.seq_prefix || 'TRV'
  const year = row?.seq_year || new Date().getFullYear()
  const num = row?.seq_number || 1
  return `${prefix}${year}${String(num).padStart(4, '0')}`
}

export async function POST(request: Request) {
  // RLS bypass: portal token ile anon erişim — admin client kullan
  const admin = createAdminClient()
  const body = await request.json()
  const { token, description, amount, note } = body
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })

  // amount doğrulama
  const parsedAmount = parseFloat(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'Tutar sıfırdan büyük olmalı' }, { status: 400 })
  }
  // Y-4: Üst sınır — fatura talebi en fazla 1.000.000 TL
  const MAX_REQUEST_AMOUNT = 1_000_000
  if (parsedAmount > MAX_REQUEST_AMOUNT) {
    return NextResponse.json({ error: 'Tutar çok yüksek' }, { status: 400 })
  }

  // Find client by portal token
  const { data: client } = await admin
    .from('clients')
    .select('id, name, company, email, tenant_id')
    .eq('token', token)
    .maybeSingle()

  if (!client?.tenant_id) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

  const tenantId = client.tenant_id as string

  // Tenant owner'ı bul (created_by için)
  const { data: tenant } = await admin
    .from('tenants')
    .select('owner_id')
    .eq('id', tenantId)
    .maybeSingle()

  if (!tenant?.owner_id) return NextResponse.json({ error: 'Kiracı bulunamadı' }, { status: 500 })

  const invoiceNumber = await generateInvoiceNumber(tenantId)

  const lineTotal = parsedAmount
  // Y-4: KDV oranı whitelist
  const ALLOWED_KDV_RATES = [0, 1, 10, 20]
  const kdvRate = ALLOWED_KDV_RATES.includes(body.kdv_rate) ? body.kdv_rate : 20
  const kdvAmount = lineTotal * kdvRate / 100
  const total = lineTotal + kdvAmount

  const { data: invoice } = await admin
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      client_id: client.id,
      created_by: tenant.owner_id,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      notes: note,
      client_name: client.name,
      client_company: client.company,
      client_email: client.email,
      subtotal: lineTotal,
      kdv_rate: kdvRate,
      kdv_amount: kdvAmount,
      total,
      requested_by_client: true,
      request_note: note,
      status: 'draft',
    })
    .select('id')
    .single()

  if (!invoice) return NextResponse.json({ error: 'Fatura oluşturulamadı' }, { status: 500 })

  await admin.from('invoice_items').insert({
    invoice_id: invoice.id,
    description: description || 'Talep edilen hizmet',
    quantity: 1,
    unit: 'adet',
    unit_price: parsedAmount,
    kdv_rate: kdvRate,
    kdv_amount: kdvAmount,
    line_total: lineTotal,
    sort_order: 0,
  })

  after(() => {
    dispatchEvent(tenantId, WEBHOOK_EVENTS.INVOICE_CREATED, {
      id: invoice.id,
      invoice_number: invoiceNumber,
      client_name: client.name || '',
      total,
      status: 'draft',
    }).catch(() => {})
  })

  return NextResponse.json({ ok: true, invoiceId: invoice.id })
}
