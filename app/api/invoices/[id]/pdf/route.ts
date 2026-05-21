import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { generateAndStoreInvoicePDF } from '@/lib/pdf/generate-invoice'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params

  // Check if PDF already exists
  const supabase = await createClient()
  const { data: inv } = await supabase
    .from('invoices')
    .select('pdf_url, pdf_generated_at, updated_at')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle()

  if (!inv) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  let pdfUrl = inv.pdf_url
  // Regenerate if invoice was updated after PDF generation
  if (!pdfUrl || !inv.pdf_generated_at || new Date(inv.updated_at) > new Date(inv.pdf_generated_at)) {
    try {
      pdfUrl = await generateAndStoreInvoicePDF(id, ctx.tenantId)
    } catch (e) {
      console.error('PDF oluşturma hatası:', e)
      return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })
    }
  }

  if (!pdfUrl) return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })

  return NextResponse.redirect(pdfUrl)
}
