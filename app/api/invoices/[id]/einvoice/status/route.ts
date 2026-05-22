import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { createClient } from '@/lib/supabase/server'
import { getEInvoiceProvider } from '@/lib/einvoice'

// GET /api/invoices/[id]/einvoice/status — entegratörden güncel durumu sorgula
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContext()
  const { id } = await params

  const supabase = await createClient()

  // En son e-belge kaydını bul
  const { data: doc } = await supabase
    .from('einvoice_documents')
    .select('*')
    .eq('invoice_id', id)
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!doc || !doc.integrator_doc_id) {
    return NextResponse.json({ status: 'none', message: 'Henüz e-Belge gönderilmemiş' })
  }

  if (doc.status === 'accepted' || doc.status === 'cancelled') {
    // Nihai durum, tekrar sorgulamaya gerek yok
    return NextResponse.json(doc)
  }

  // Provider'dan güncel durumu sorgula
  try {
    const provider = getEInvoiceProvider()
    const result = await provider.getDocumentStatus(doc.integrator_doc_id)

    // DB'yi güncelle
    const updateData: Record<string, unknown> = {
      status: result.status,
      gib_response: result.gibResponse || doc.gib_response,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (result.pdfUrl) updateData.pdf_url = result.pdfUrl
    if (result.xmlUrl) updateData.xml_url = result.xmlUrl

    await supabase
      .from('einvoice_documents')
      .update(updateData)
      .eq('id', doc.id)

    // invoices.einvoice_status'i de güncelle
    await supabase
      .from('invoices')
      .update({
        einvoice_status: result.status === 'accepted' ? 'accepted' : doc.status === 'sent' ? 'sent' : result.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ ...doc, ...updateData, id: doc.id })
  } catch (e) {
    return NextResponse.json({
      ...doc,
      error_message: e instanceof Error ? e.message : 'Durum sorgulanamadı',
    })
  }
}
