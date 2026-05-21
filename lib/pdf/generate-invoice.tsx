import { renderToBuffer } from '@react-pdf/renderer'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client'
import { createClient } from '@/lib/supabase/server'
import InvoicePDF from './invoice-template'

export async function generateAndStoreInvoicePDF(invoiceId: string, tenantId: string): Promise<string | null> {
  const supabase = await createClient()

  // Fetch invoice with items
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!invoice) return null

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order')

  // Fetch issuer company info
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, company_tax_office, company_tax_number, company_address, company_city, company_bank_iban, brand_name')
    .eq('id', invoice.created_by)
    .maybeSingle()

  const invoiceData = {
    ...invoice,
    items: items || [],
    issuer_name: profile?.company_name || profile?.brand_name || 'Trevo',
    issuer_tax_office: profile?.company_tax_office,
    issuer_tax_number: profile?.company_tax_number,
    issuer_address: [profile?.company_address, profile?.company_city].filter(Boolean).join(', '),
    bank_iban: profile?.company_bank_iban,
    brand_name: profile?.brand_name,
  }

  const buffer = await renderToBuffer(<InvoicePDF invoice={invoiceData} />)

  const key = `${tenantId}/invoices/${invoiceId}.pdf`
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: 'application/pdf',
  }))

  const pdfUrl = `${R2_PUBLIC_URL}/${key}`

  // Update invoice with PDF URL
  await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl, pdf_generated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  return pdfUrl
}
