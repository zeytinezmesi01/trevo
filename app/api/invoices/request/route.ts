import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoiceNumber } from '@/lib/invoice/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { token, description, amount, note } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })

  // Find client by portal token
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, email, tenant_id')
    .eq('token', token)
    .maybeSingle()

  if (!client?.tenant_id) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

  const invoiceNumber = await generateInvoiceNumber(client.tenant_id as string)

  const lineTotal = parseFloat(amount) || 0
  const kdvRate = 20
  const kdvAmount = lineTotal * kdvRate / 100
  const total = lineTotal + kdvAmount

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      tenant_id: client.tenant_id,
      client_id: client.id,
      created_by: client.tenant_id, // fallback, ideally the owner
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

  await supabase.from('invoice_items').insert({
    invoice_id: invoice.id,
    description: description || 'Talep edilen hizmet',
    quantity: 1,
    unit: 'adet',
    unit_price: parseFloat(amount) || 0,
    kdv_rate: kdvRate,
    kdv_amount: kdvAmount,
    line_total: lineTotal,
    sort_order: 0,
  })

  return NextResponse.json({ ok: true, invoiceId: invoice.id })
}
