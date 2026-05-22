import { createClient } from '@/lib/supabase/server'
import { calculateTotals } from './calculator'
import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: ['cancelled'],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
}

export async function generateInvoiceNumber(
  tenantId: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const client = supabase || await createClient()
  const { data } = await client
    .rpc('next_invoice_number', { p_tenant_id: tenantId })
    .maybeSingle()
  const row = data as { seq_prefix: string; seq_year: number; seq_number: number } | null
  const prefix = row?.seq_prefix || 'TRV'
  const year = row?.seq_year || new Date().getFullYear()
  const num = row?.seq_number || 1
  return `${prefix}${year}${String(num).padStart(4, '0')}`
}

export async function listInvoices(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, status, total, invoice_date, due_date, created_at, einvoice_status, einvoice_type')
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

export async function createInvoice(
  tenantId: string,
  userId: string,
  data: {
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
    tevkifat_rate?: number
    items: { description: string; quantity: number; unit: string; unit_price: number; kdv_rate: number }[]
  },
  supabase?: SupabaseClient,
): Promise<string> {
  const client = supabase || await createClient()
  const invoiceNumber = await generateInvoiceNumber(tenantId, client)

  const itemsForCalc = data.items.map((item) => ({
    ...item,
    kdv_rate: data.vat_exempt ? 0 : item.kdv_rate,
  }))
  const totals = calculateTotals(itemsForCalc, data.tevkifat_rate || 0)

  const displayKdvRate = data.vat_exempt ? 0 : (data.items[0]?.kdv_rate || 20)

  // G-1: Invoice ekle
  const { data: invoice, error: invoiceError } = await client
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
      subtotal: totals.subtotal,
      kdv_rate: displayKdvRate,
      kdv_amount: totals.kdvAmount,
      tevkifat_rate: data.tevkifat_rate || 0,
      tevkifat_amount: totals.tevkifatAmount,
      total: totals.total,
      vat_exempt: data.vat_exempt || false,
      status: 'draft',
    })
    .select('id')
    .single()

  if (invoiceError || !invoice) {
    throw new Error(`Fatura oluşturulamadı: ${invoiceError?.message || 'bilinmeyen hata'}${invoiceError?.code ? ` (kod: ${invoiceError.code})` : ''}`)
  }

  // G-1: Items ekle; hata olursa faturayı temizle
  try {
    const items = data.items.map((item, i) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      kdv_rate: data.vat_exempt ? 0 : item.kdv_rate,
      kdv_amount: data.vat_exempt ? 0 : item.quantity * item.unit_price * item.kdv_rate / 100,
      line_total: item.quantity * item.unit_price,
      sort_order: i,
    }))

    const { error: itemsError } = await client.from('invoice_items').insert(items)
    if (itemsError) throw itemsError
  } catch (e) {
    // Items hatası → yetim faturayı temizle
    await client.from('invoices').delete().eq('id', invoice.id).then(() => {}, () => {})
    throw e
  }

  return invoice.id as string
}

// G-2: İzin verilen durum geçişlerini kontrol et
export async function updateInvoiceStatus(invoiceId: string, tenantId: string, status: string, data?: { emailed_at?: string; email_to?: string; pdf_url?: string }) {
  const supabase = await createClient()

  // Mevcut durumu oku
  const { data: current } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (current) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[current.status as string] || []
    if (status && current.status !== status && !allowed.includes(status)) {
      throw new Error(`"${current.status}" durumundan "${status}" durumuna geçiş yapılamaz`)
    }
  }

  const update: Record<string, unknown> = { status, ...data, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('invoices').update(update).eq('id', invoiceId).eq('tenant_id', tenantId)
  if (error) throw error
}

export async function deleteInvoice(invoiceId: string, tenantId: string) {
  const supabase = await createClient()
  await supabase.from('invoices').delete().eq('id', invoiceId).eq('tenant_id', tenantId)
}
