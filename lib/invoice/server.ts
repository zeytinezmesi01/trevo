import { createClient } from '@/lib/supabase/server'

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  // Atomic sequence increment
  const { data: seq } = await supabase
    .from('invoice_number_sequences')
    .select('last_number')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const nextNum = (seq?.last_number || 0) + 1
  const number = `TRV${year}${String(nextNum).padStart(4, '0')}`

  await supabase
    .from('invoice_number_sequences')
    .upsert({ tenant_id: tenantId, year, last_number: nextNum })

  return number
}

export async function listInvoices(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, status, total, invoice_date, due_date, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getInvoice(invoiceId: string, tenantId: string) {
  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (!invoice) return null

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true })

  return { ...invoice, items: items || [] }
}

export async function createInvoice(tenantId: string, userId: string, data: {
  client_id: string
  client_name: string
  client_company?: string
  client_email?: string
  client_tax_office?: string
  client_tax_number?: string
  client_address?: string
  client_city?: string
  invoice_date?: string
  due_date?: string
  notes?: string
  vat_exempt?: boolean
  items: { description: string; quantity: number; unit: string; unit_price: number; kdv_rate: number }[]
}) {
  const supabase = await createClient()
  const invoiceNumber = await generateInvoiceNumber(tenantId)

  // Calculate totals
  let subtotal = 0; let kdvTotal = 0
  for (const item of data.items) {
    const lineTotal = item.quantity * item.unit_price
    const kdv = lineTotal * item.kdv_rate / 100
    subtotal += lineTotal
    kdvTotal += kdv
  }

  const kdvRate = data.items[0]?.kdv_rate || 20
  const total = subtotal + kdvTotal

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      client_id: data.client_id,
      created_by: userId,
      invoice_number: invoiceNumber,
      invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
      due_date: data.due_date,
      notes: data.notes,
      client_name: data.client_name,
      client_company: data.client_company,
      client_email: data.client_email,
      client_tax_office: data.client_tax_office,
      client_tax_number: data.client_tax_number,
      client_address: data.client_address,
      client_city: data.client_city,
      subtotal,
      kdv_rate: kdvRate,
      kdv_amount: kdvTotal,
      total,
      vat_exempt: data.vat_exempt || false,
      status: 'draft',
    })
    .select('id')
    .single()

  if (!invoice) throw new Error('Fatura oluşturulamadı')

  // Insert items
  const items = data.items.map((item, i) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    kdv_rate: item.kdv_rate,
    kdv_amount: item.quantity * item.unit_price * item.kdv_rate / 100,
    line_total: item.quantity * item.unit_price,
    sort_order: i,
  }))

  await supabase.from('invoice_items').insert(items)

  return invoice.id as string
}

export async function updateInvoiceStatus(invoiceId: string, tenantId: string, status: string, data?: { emailed_at?: string; email_to?: string; pdf_url?: string }) {
  const supabase = await createClient()
  const update: Record<string, unknown> = { status, ...data, updated_at: new Date().toISOString() }
  await supabase.from('invoices').update(update).eq('id', invoiceId).eq('tenant_id', tenantId)
}

export async function deleteInvoice(invoiceId: string, tenantId: string) {
  const supabase = await createClient()
  await supabase.from('invoices').delete().eq('id', invoiceId).eq('tenant_id', tenantId)
}
